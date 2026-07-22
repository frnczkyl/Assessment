# AI Workflow Note

**Live demo:** https://assessment--production.up.railway.app/login · **Walkthrough:** https://youtu.be/c9bq0UMudDI

This is an AI-forward role, so I used AI deliberately — as a fast pair-programmer and reviewer — while keeping architecture, security, and product-scope decisions my own.

## Tools used

- **Claude Code (Opus 4.8)** — the primary tool. Used inside my editor/terminal to scaffold the project, generate boilerplate, draft components, and — importantly — to *run and verify* its own output (installing deps, running migrations, executing the test suite, and `curl`-ing the live API to confirm behavior).
- **AI autocomplete** for small in-line fills (repetitive JSX, type annotations).

## Where AI materially sped things up

1. **Boilerplate and glue.** Prisma schema scaffolding, the `zod` validation schemas, Next.js route-handler skeletons, and the CSS design system were drafted far faster than by hand. This is where most of the time savings came from.
2. **The TipTap wiring.** Getting the editor configured correctly for the Next.js App Router — `immediatelyRender: false` to avoid SSR hydration mismatches, the extension set, and the debounced-autosave hook — is fiddly integration work that AI accelerated.
3. **File-import conversions.** Mapping `.md → marked`, `.docx → mammoth`, and `.txt → paragraphs`, plus the sanitization allowlist, was assembled quickly and then hardened with tests.
4. **Documentation drafting.** The first drafts of the README and this note were AI-assisted, then edited for accuracy against the actual code.

## What I changed or rejected

- **Security was not left to the default.** Early generated handlers stored and rendered editor HTML directly. I rejected that and added a single `sanitize.ts` allowlist enforced on **every write** (editor output *and* file imports), then wrote a test proving hostile markup (`<script>`, `onerror=`) is stripped. Trusting model-generated HTML handling unreviewed would have been an XSS hole.
- **Access control was pulled out of the routes.** The initial suggestion scattered `ownerId === userId` checks inline in each endpoint. I refactored authorization into a **pure `access.ts` module** with `resolveRole` + capability helpers so the rules are single-sourced and unit-testable — a maintainability/correctness call the model didn't make on its own.
- **Session handling was simplified on purpose.** AI reached for a full auth library. For the timebox I rejected that in favor of a small signed-cookie session, and documented the production upgrade path — a scope decision, not a technical limitation.
- **Import edge cases were tightened by hand.** I added the empty-file check, the 2 MB size limit, and the constant-time signature comparison after reviewing the generated happy-path code.

## How I verified correctness, UX, and reliability

- **Automated tests** (`npm test`, 15 passing) on the two highest-risk pure modules: the authorization matrix and the import/sanitization pipeline.
- **End-to-end manual verification** of the HTTP layer with `curl` using real session cookies — login, create, rename, edit-with-malicious-content (confirmed sanitized), share, **viewer blocked from editing (403)**, non-owner blocked from sharing (403), unauthenticated (401), Markdown import, and unsupported-type rejection (400).
- **A clean production build** (`npm run build`) with TypeScript strict mode — no type escapes, no `any` shortcuts left in from generated code.
- **UX checked by using it** — autosave timing, the owned-vs-shared distinction, role badges, and view-only state were exercised in the browser, not assumed.

**Principle I worked to:** AI wrote a lot of the *typing*, but every security boundary, authorization rule, and scope tradeoff was reviewed and, where needed, rewritten by me. The tests and the manual verification exist precisely so I'm not taking generated code on faith.
