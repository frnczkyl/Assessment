# Submission — Ajaia Docs

**Candidate:** Francis Kyle Lorenzana
**Project:** Ajaia Docs — a lightweight collaborative document editor

---

## Live product URL

**🔗 https://assessment--production.up.railway.app/login**

Deployed on Railway (Docker + SQLite on a persistent volume). See
[ARCHITECTURE.md → Deployment](./ARCHITECTURE.md#deployment).

**Demo login:** `alice@ajaia.dev` / `password123` (also `bob@ajaia.dev` and `carol@ajaia.dev`).

## Walkthrough video

**🎬 https://youtu.be/c9bq0UMudDI**

(Also saved in [`WALKTHROUGH.txt`](./WALKTHROUGH.txt).)

---

## What's included

| Item                          | Location                                  |
| ----------------------------- | ----------------------------------------- |
| Source code                   | `src/`, `prisma/`, `tests/`               |
| Local setup & run instructions| [README.md](./README.md)                  |
| Architecture note             | [ARCHITECTURE.md](./ARCHITECTURE.md)      |
| AI workflow note              | [AI_WORKFLOW.md](./AI_WORKFLOW.md)         |
| This manifest                 | SUBMISSION.md                             |
| Walkthrough video link        | [WALKTHROUGH.txt](./WALKTHROUGH.txt)      |
| Automated tests               | `tests/access.test.ts`, `tests/import.test.ts` (15 passing) |

## Core requirements — status

| Requirement                                            | Status | Notes |
| ------------------------------------------------------ | :----: | ----- |
| Create / rename / edit / save / reopen documents       | ✅ | Autosave ~1s after typing stops |
| Rich text: bold, italic, underline, headings, lists    | ✅ | + strikethrough, quote, code block |
| File upload → new editable document                    | ✅ | `.txt`, `.md`, `.docx` (max 2 MB), types stated in UI |
| Sharing: owner + grant access + owned/shared distinction | ✅ | Viewer/Editor roles, server-enforced |
| Persistence (survives refresh; structure preserved)    | ✅ | SQLite via Prisma |
| Setup & run instructions                               | ✅ | README |
| Live deployment                                        | ✅ | https://assessment--production.up.railway.app/login |
| Validation & error handling                            | ✅ | `zod` + sanitization + typed error responses |
| ≥1 meaningful automated test                           | ✅ | 15 tests over auth + import/sanitization |
| Architecture note                                      | ✅ | ARCHITECTURE.md |
| AI-native workflow note                                | ✅ | AI_WORKFLOW.md |

**Stretch included:** role-based sharing permissions (viewer vs editor) beyond basic access; simple Download-as-HTML export.

## How to run locally (short form)

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init   # creates + seeds prisma/dev.db
npm run dev                          # http://localhost:3000
npm test                             # run the test suite
```

## Intentional scope cuts

Real-time co-editing, full auth (signup/reset/OAuth), version history, comments, and PDF/Markdown export were deprioritized in favor of depth in editing, import, and the sharing/access model. Rationale in [ARCHITECTURE.md](./ARCHITECTURE.md#what-i-intentionally-deprioritized).
