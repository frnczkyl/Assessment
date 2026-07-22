# Ajaia Docs

A lightweight collaborative document editor — inspired by Google Docs, built for the Ajaia AI-Native Full Stack assignment.

Create rich-text documents in the browser, import files into new drafts, and share documents with teammates as **viewers** or **editors**. Everything persists to a local SQLite database, so it runs with zero external services.

> **Scope note:** This is a deliberately focused product slice, not a Google Docs clone. Depth was prioritized in three areas — the **editing experience**, **file import**, and the **sharing / access model**. See [ARCHITECTURE.md](./ARCHITECTURE.md) for what was intentionally cut and why.

---

## Tech stack

| Concern      | Choice                                             |
| ------------ | -------------------------------------------------- |
| Framework    | Next.js 14 (App Router) + React 18 + TypeScript    |
| Editor       | TipTap (ProseMirror) — rich text as sanitized HTML |
| Database     | SQLite via Prisma ORM                              |
| Auth         | Lightweight signed-cookie sessions, seeded users   |
| File import  | `marked` (Markdown), `mammoth` (.docx), plain text |
| Security     | `sanitize-html` on every write; `zod` validation   |
| Tests        | Vitest                                             |

---

## Prerequisites

- **Node.js 18.18+** (developed on Node 24)
- npm

No database server, cloud account, or paid service is required.

---

## Setup & run (local)

```bash
# 1. Install dependencies
npm install

# 2. Create the .env file (copy the example)
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env

# 3. Create the database schema and seed demo data
npx prisma migrate dev --name init   # creates prisma/dev.db and seeds it
#   (if the DB already exists, just seed:  npm run db:seed)

# 4. Start the dev server
npm run dev
```

Open **http://localhost:3000** and sign in with a demo account below.

### Production build

```bash
npm run build     # runs prisma generate + migrate deploy + next build
npm start
```

---

## Demo accounts

All three share the password **`password123`**. On the login screen you can click a name to auto-fill it.

| Name         | Email             |
| ------------ | ----------------- |
| Alice Rivera | `alice@ajaia.dev` |
| Bob Chen     | `bob@ajaia.dev`   |
| Carol Diaz   | `carol@ajaia.dev` |

The seed gives Alice two documents and shares one with Bob, so **sharing is demonstrable immediately** — sign in as Alice to see owned docs, then as Bob to see the same doc under "Shared with me."

---

## What you can do

1. **Create / rename / edit / reopen documents.** Rich text: bold, italic, underline, strikethrough, H1–H3, bulleted & numbered lists, quotes, code blocks. Edits **autosave** ~1s after you stop typing.
2. **Import a file into a new document.** Supported types: **`.txt`, `.md`, `.docx`** (max **2 MB**). Unsupported types are rejected with a clear message. The file is converted to formatted, sanitized HTML you can keep editing.
3. **Share a document.** The owner opens **Share**, enters a teammate's email, and picks **Viewer** (read-only) or **Editor** (can change content). The dashboard separates **My documents** from **Shared with me**, with a role badge on each shared doc.
4. **Download** a document as a self-contained `.html` file.

---

## Testing

```bash
npm test
```

Covers the two pieces of pure logic most worth protecting: the **access-control rules** (owner/editor/viewer capabilities) and the **file-import + sanitization** pipeline (Markdown/text conversion, unsupported-type and empty-file rejection, and stripping of dangerous markup). See [ARCHITECTURE.md](./ARCHITECTURE.md#testing) for the rationale.

---

## Scripts

| Script              | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Start the dev server                       |
| `npm run build`     | Generate client, apply migrations, build   |
| `npm start`         | Start the production server                |
| `npm test`          | Run the Vitest suite                       |
| `npm run db:seed`   | Seed / re-seed demo data (idempotent)      |
| `npm run db:reset`  | Drop, recreate, and re-seed the database   |

---

## Deployment

See [ARCHITECTURE.md → Deployment](./ARCHITECTURE.md#deployment) for the recommended free path and the SQLite persistence tradeoff. A live URL is listed in [SUBMISSION.md](./SUBMISSION.md).

---

## Documentation map

- [ARCHITECTURE.md](./ARCHITECTURE.md) — what I prioritized, the data model, tradeoffs, and what I cut
- [AI_WORKFLOW.md](./AI_WORKFLOW.md) — how AI tools were used, and what I changed or rejected
- [SUBMISSION.md](./SUBMISSION.md) — exactly what's included and where the live URL / video live
