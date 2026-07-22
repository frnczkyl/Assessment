# Architecture Note

## The bet: depth in three areas, not breadth everywhere

The prompt is open-ended enough that I could have spread effort thin across a dozen half-working Google Docs features. Instead I picked the three surfaces that best demonstrate full-stack judgment and went deep on them:

1. **A coherent editing experience** — a real rich-text editor (TipTap/ProseMirror) with autosave, not a `contentEditable` div or a plain `<textarea>`.
2. **File import as a product flow** — upload `.txt` / `.md` / `.docx` and get a genuinely editable, formatted document, with the conversion + sanitization logic isolated and unit-tested.
3. **A sharing model with real access control** — owner / editor / viewer roles enforced consistently on the server, with the UI reflecting them.

Everything else was kept intentionally minimal so those three stay solid.

---

## System shape

Single **Next.js (App Router)** application — one deployable, no separate API service to run or CORS to manage.

```
Browser (React client components)
   │  fetch()  →  Route Handlers (/api/*)   ← server-only, hold all auth + DB logic
   │                     │
   │                     ▼
   │              Prisma Client  →  SQLite (prisma/dev.db)
   ▼
Server Components (dashboard, editor shell) read the DB directly for first paint
```

- **Reads for first paint** (dashboard list, opening a document) happen in **server components** that query Prisma directly — fast, no client fetch waterfall, and access is checked before any data is sent.
- **Mutations** (create, rename, edit, share, import, delete) go through **`/api` route handlers**, so all authorization lives in one server-side layer.

### Key modules (`src/lib`)

| Module          | Responsibility                                                        |
| --------------- | --------------------------------------------------------------------- |
| `access.ts`     | **Pure** role resolution + capability checks (`canView/canEdit/canManage`). No DB — trivially testable. |
| `documents.ts`  | Loads a document and resolves the caller's role in one place.         |
| `session.ts`    | Signed-cookie session (HMAC over the user id) — create/verify/destroy. |
| `sanitize.ts`   | HTML allowlist applied on **every write**, so stored content is always safe to render. |
| `import.ts`     | File → sanitized HTML conversion (pure, buffer-in), the core of the import feature. |
| `validation.ts` | `zod` schemas for every request body.                                 |
| `http.ts`       | Consistent JSON responses + an error-handling wrapper for routes.     |

---

## Data model

Three tables (`prisma/schema.prisma`):

- **User** — `id, email (unique), name, password (bcrypt hash)`
- **Document** — `id, title, content (sanitized HTML), ownerId, timestamps`
- **Share** — `documentId, userId, role ("viewer" | "editor")`, unique on `(documentId, userId)`

**Why store content as HTML?** TipTap serializes to/from HTML natively, the browser renders it directly, and one `sanitize-html` allowlist secures both editor output and imported files. A production system with real-time collaboration would move to a CRDT/OT document (e.g. Yjs) and store structured state instead — noted as a deliberate deferral below.

**Access is a pure function.** `resolveRole(doc, userId)` returns `owner | editor | viewer | null`; owner always wins over any share. Every protected route calls `loadDocumentWithRole` then a capability check, so the rules can't drift between endpoints and are covered by unit tests.

---

## Security

- **XSS:** every write is sanitized against a tag/attribute allowlist. Imported `.md`/`.docx`/`.txt` goes through the same gate, so a malicious file can't inject script (covered by tests).
- **Session integrity:** the cookie is `httpOnly`, `sameSite=lax`, `secure` in production, and HMAC-signed with `SESSION_SECRET`; verification uses a constant-time compare.
- **AuthZ on every mutation:** viewers get `403` on edit, non-owners get `403` on share/delete, unauthenticated requests get `401`. All verified manually and by test.
- **Input validation:** `zod` on all bodies; import enforces type + 2 MB size limits.

---

## Testing

`npm test` (Vitest). I put automated coverage where a regression would be **silent and dangerous**, rather than chasing a coverage number:

- **`access.test.ts`** — the authorization matrix (owner/editor/viewer/stranger × view/edit/manage). If this breaks, someone sees or edits a doc they shouldn't.
- **`import.test.ts`** — Markdown/text conversion, title derivation, unsupported-type and empty-file rejection, and **sanitization of hostile markup**. This is the untrusted-input boundary.

Both target pure functions, so they run in milliseconds with no DB or server. The HTTP layer was verified manually via `curl` across the full flow (login → create → edit → share → viewer-blocked → import); those results are summarized in the walkthrough.

---

## Auth: what this is, and what production would be

For the timebox, auth is **seeded users + a signed-cookie session**. This is enough to demonstrate *distinct real users* sharing documents — which is the point of the feature — without spending hours on signup, email verification, and password reset. Passwords are still bcrypt-hashed and sessions are signed; it's lightweight, not insecure-by-design.

A production version would swap `session.ts` for NextAuth or a real IdP with short-lived rotating tokens, add self-serve signup, and rate-limit login. The rest of the app wouldn't change, because everything downstream only depends on `getCurrentUser()`.

---

## Deployment

**Recommended path:** any host with a small persistent disk — **Railway**, **Fly.io**, or **Render** — since the app uses file-based SQLite. Migrations and seeding run at **container startup** (Dockerfile `CMD`: `prisma migrate deploy && npm run db:seed && npm start`), not during the image build, so the build never needs a live database. The host must provide `DATABASE_URL` (pointing at a file on the mounted volume, e.g. `file:/data/prod.db`) and `SESSION_SECRET`. Reviewers only visit the URL, so no paid dependency is required to review it.

**The SQLite tradeoff, stated honestly:** on an *ephemeral* filesystem (e.g. Vercel's serverless functions), a SQLite file doesn't persist across deploys/cold starts. Two clean options: (a) deploy to a host with a persistent volume (above), or (b) point `DATABASE_URL` at a hosted libSQL/Turso free tier — Prisma speaks the same SQLite dialect, so **no code changes** are needed, only the connection string. I chose local SQLite because it makes the project trivially runnable for reviewers, which the prompt weights heavily.

---

## What I intentionally deprioritized

- **Real-time multi-cursor collaboration.** The sharing *model* is real and enforced; live co-editing (CRDT/WebSockets) is a multi-day feature and out of scope. Two users editing the same doc is "last write wins."
- **Full auth** (signup, reset, OAuth) — replaced by seeded users, see above.
- **Document version history, comments, folders, search, trash/restore.**
- **A polished export pipeline** — I included a simple, honest **Download as `.html`**; PDF/Markdown export were left out rather than done shallowly.
- **Rich media in the editor** (images, tables) — kept the toolbar to the required formatting set plus a couple of natural extras (quote, code block).

Each of these is a clean extension point, not a rewrite — the data model and the `getCurrentUser` / `resolveRole` seams were chosen so they could be added without disturbing what's already working.
