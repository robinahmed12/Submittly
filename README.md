# Submittly — Project Submission & Review Dashboard

Submittly is a full-stack platform for the student-project workflow: **students submit their course projects, mentors review them** — approve or reject with a comment and dashboard totals — and **admins use the same review surfaces**. It is an API-first system with two disciplined apps:

| App                        | Path                            | What it is                                                                                                                                                            |
| -------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server-side (API)**      | [`Server-side/`](./Server-side) | Express 5 + Prisma 7 / PostgreSQL API — JWT auth with role-based access control, Zod-validated boundaries, rate limiting, and a single, documented response envelope. |
| **Client-side (Frontend)** | [`Client-side/`](./Client-side) | Next.js 16 App Router frontend — Server Components with a hard server-side proxy to the API, so the browser never touches the API or the token directly.              |
| **Docs**                   | [`Docs/`](./Docs)               | The requirements spec and the assumptions/design-decisions record.                                                                                                    |

Both READMEs in the app folders are complete references (setup, API/schema details, design system). This file explains the project as a whole and is the entry point into the documentation.

---

## Table of contents

- [What it does](#what-it-does)
- [How the pieces fit](#how-the-pieces-fit)
- [Roles & permissions](#roles--permissions)
- [Core business rules](#core-business-rules)
- [Documentation map](#documentation-map)
- [Quick start](#quick-start)
- [Demo accounts](#demo-accounts)
- [Repo structure](#repo-structure)
- [Design highlights](#design-highlights)
- [Quality gates](#quality-gates)

---

## What it does

1. **Students** sign up, then submit a project: name, repository URL, an optional live link, and a description. They can browse **their own** submissions in a searchable, status-filterable table and see each submission's review state evolve: `PENDING → APPROVED` or `PENDING → REJECTED`.
2. **Mentors** (and the seeded Admin) browse **every** submission in a paginated review queue with server-side status filtering, approve or reject the ones still pending (with an optional feedback comment), and monitor global stats — pending / approved / rejected counts.
3. **Duplicate protection** is server- and database-enforced: one repository URL per student, forever.
4. Nothing review-related is trusted to the UI: role gating, ownership scoping, validation, pagination, and filtering all happen on the server; the frontend mirrors them purely for usability.

## How the pieces fit

```
Browser  ·  Next.js 16 + React 19
  │  page shells are Server Components; interactive leaves
  │  (tables, forms, dialogs, navs) are client components
  │  the browser only ever calls same-origin /api/backend/*
  │  → no CORS, and the token never reaches JavaScript
  ▼
Next route-handler proxy
  │  reads/writes the httpOnly session cookie
  │  attaches "Authorization: Bearer" server-side
  ▼
Express 5 API  ·  :4000
  │  helmet → CORS allowlist → Zod validation → rate limiters
  │  routers: /api/auth → /api/submissions → /api/mentor
  ▼
Prisma 7  ·  pg driver adapter
  ▼
PostgreSQL:  users ──< submissions ──< feedback
             └──────────────────────── (1:N, cascading)
```

Every request is authorized independently: the JWT is verified, the role is checked against a per-route allowlist, and all student-scoped queries derive the owner from the token — a client can never parametrize "which student" it reads.

## Roles & permissions

| Capability                                | Student | Mentor | Admin |
| ----------------------------------------- | :-----: | :----: | :---: |
| Sign up through the public form           |    ✔    |   —    |   —   |
| Log in                                    |    ✔    |   ✔    |   ✔   |
| Create submission                         |    ✔    |   —    |   —   |
| View own submissions                      |    ✔    |   —    |   —   |
| View all submissions                      |    —    |   ✔    |   ✔   |
| Server-side filter + paginate review list |    —    |   ✔    |   ✔   |
| Approve / reject pending submission       |    —    |   ✔    |   ✔   |
| Global review stats                       |    —    |   ✔    |   ✔   |

## Core business rules

1. **One repo URL per student.** The URL is normalized (trimmed, `#hash`/`?query` stripped, trailing slash dropped) before storage and enforced by a compound unique constraint → `409 DUPLICATE_SUBMISSION`.
2. **Submissions always start `PENDING`** and clients cannot set a status.
3. **Reviews are final.** The only allowed transition is `PENDING → APPROVED | REJECTED`; re-reviewing returns `422 INVALID_STATUS_TRANSITION`, and the write is a race-safe conditional update inside a transaction with the optional feedback insert.
4. **Self-registration is student-only.** Mentors and the Admin exist exclusively via database seed.
5. **Validation is authoritative server-side** (Zod on every boundary: body, query, params); client-side validation exists only for faster feedback.
6. **Anti-spam:** 5 submissions / 15 min per student and 10 auth attempts / 15 min, plus a global 1000-request ceiling.

## Documentation map

| Document                                                                                     | Role                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[`Docs/ASSUMPTIONS_AND_DESIGN_DECISIONS.md`](./Docs/ASSUMPTIONS_AND_DESIGN_DECISIONS.md)** | The product-level assumptions & design-decisions record: 15 numbered decisions covering roles, auth lifecycle, duplication, validation, review transitions, pagination, and the MVP scope — including a permission matrix, acceptance checks, and explicit "out of scope" items. |
| [`Docs/submittly_project_requirements.md`](./Docs/submittly_project_requirements.md)         | The original requirements spec this implementation obeys.                                                                                                                                                                                                                        |
| [`Server-side/README.md`](./Server-side/README.md)                                           | The complete backend reference: ER schema diagram, endpoint-by-endpoint API reference, middleware pipeline, error envelope, rate limiting, business rules.                                                                                                                       |
| [`Client-side/README.md`](./Client-side/README.md)                                           | The complete frontend reference: feature overview, routes, architecture, design system (brand palette, typography, theming), data-fetching/state/form conventions, accessibility.                                                                                                |
| [`Client-side/docs/implementation-plan.md`](./Client-side/docs/implementation-plan.md)       | Deep architectural plan for the frontend with the numbered decision log (§12) that supersedes assumptions where they differ.                                                                                                                                                     |

> **Note:** the assumptions document is a _proposal made before implementation_. Its "Implementation status" note (top of that file) lists the deltas — e.g. repo-URL normalization happens before storage instead of in a separate column, feedback is optional for both approve and reject, and validation bounds landed at 3–120 / 10–4,000 — and points at the authoritative implementation docs.

## Quick start

```bash
# 1 — start the API (port 4000)
cd Server-side
npm install
cp .env.example .env           # set DATABASE_URL + JWT_SECRET (32+ chars)
npm run prisma:migrate         # create the schema
npm run prisma:seed            # seed the ADMIN (+ optional MENTOR) accounts
npm run dev

# 2 — start the frontend (port 3000)
cd ../Client-side
npm install
cp .env.example .env.local     # API_URL=http://localhost:4000
npm run dev
```

Open <http://localhost:3000> — signed-out visitors land on `/login`; use a demo login (below) or sign up as a student. Check liveness of the API at `GET http://localhost:4000/api/health`.

## Demo accounts

One-click demo logins (student / mentor / admin) are available on the login page — the credentials are stored client-side in `Client-side/src/features/auth/demo-accounts.ts` and mirror the server's seed:

| Role    | Email                       | Password        |
| ------- | --------------------------- | --------------- |
| Student | `shawonahmed0294@gmail.com` | `Password@#12`  |
| Mentor  | `mentor@submittly.dev`      | `ChangeMe#2026` |
| Admin   | `admin@submittly.dev`       | `ChangeMe#2026` |

These are throwaway, public demo credentials by design — rotate the seed and that file together.

## Repo structure

```
Submittly/
├── Docs/                              # requirements + assumptions/design decisions
│   ├── submittly_project_requirements.md
│   └── ASSUMPTIONS_AND_DESIGN_DECISIONS.md
├── Server-side/                       # Express 5 API + Prisma schema & migrations
│   ├── src/                           # features/{auth,submissions,review} + middlewares + lib
│   └── prisma/                        # schema.prisma, migrations, seed.ts
└── Client-side/                       # Next.js 16 frontend
    ├── src/app/                       # (auth)/(student)/(mentor) route groups + the API proxy
    ├── src/features/                  # feature slices mirroring the API's domains
    └── docs/                          # implementation plan + coding style (binding)
```

## Design highlights

- **Security boundary:** the Next route handler is the only code that talks to the API; the JWT lives in an httpOnly cookie and is attached to server-side proxy hops — browser JavaScript never sees the token, and CORS is never exercised by the browser.
- **Layered correctness:** UI gating (middleware proxy per route group) is UX only; the API re-checks everything — the assumptions record's security rule that hiding buttons is never the access control.
- **Two different list strategies, on purpose:** the student's "my submissions" list is small and token-scoped, so search/filter run client-side; the mentor queue is global and paginated, so it is always filtered and paginated server-side with URL-driven state.
- **One error envelope everywhere:** `{ success, message, code, details? }` with stable codes mirrored 1:1 on the client for precise form-field error mapping.
- **Consistent component architecture:** vertical feature slices, shared composites promoted (never duplicated) the moment a second feature needs them, generated shadcn/ui files left pristine.

## Quality gates

Both apps verify the same set before any commit:

```bash
npm run lint && npm run typecheck && npm run format:check && npm run build
```

On the frontend this additionally guarantees the production build's static/dynamic analysis; on the backend it also regenerates the Prisma client so schema drift fails fast.
