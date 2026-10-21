# Submittly — Backend Implementation Plan

> Companion doc: [coding-style.md](./coding-style.md)
> Requirements source: [../../Docs/submittly_project_requirements.md](../../Docs/submittly_project_requirements.md)

| | |
|---|---|
| Architecture | Feature-based (vertical slices) |
| Stack | Node.js + TypeScript, Express 5, Prisma ORM, PostgreSQL |
| Auth | JWT (Bearer) + role-based access control |
| Validation | Zod (server-side, always) |
| Status | Planned — build starts at Phase 1 |

---

## 1. Overview

Submittly's backend serves two applications behind one API: a **Student Portal** (create and track project submissions) and a **Mentor Review Dashboard** (paginated submissions, approve/reject actions, aggregate stats). The backend is built as an Express app organized by **feature**: each feature (`auth`, `submissions`, `review`) owns its routes, controller, service, and Zod schemas in a self-contained folder. Only genuinely cross-cutting concerns — middleware, config, the Prisma client, and small helpers — live in shared directories.

Non-negotiable rules that shape this plan:

1. **Business logic lives in services; HTTP concerns live in controllers.**
2. **Everything crossing the network boundary is validated by Zod before use.**
3. **Authorization is enforced on the server** (JWT verify + role check in middleware), never inferred from the client.
4. **Only services import Prisma.** Controllers never touch the database.

---

## 2. Tech Stack & Dependencies

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node.js 20+ | |
| Framework | Express 5 | Built-in promise rejection handling (no need for `express-async-errors`) |
| Language | TypeScript 5, `strict: true, exactOptionalPropertyTypes: true` | |
| ORM | Prisma + PostgreSQL | Single Postgres instance via `DATABASE_URL` |
| Validation | Zod 4 | Schemas are the single source of truth for inputs and types |
| Auth | `jsonwebtoken`, `bcryptjs` | Access token in `Authorization: Bearer`; 12 salt rounds |
| HTTP hardening | `helmet`, `cors`, `express-rate-limit` | |
| Dev tooling | `tsx`, ESLint (typescript-eslint), Prettier | `tsx watch src/server.ts` for dev |

**Install**

```bash
npm i express@^5 @prisma/client zod jsonwebtoken bcryptjs express-rate-limit cors helmet dotenv
npm i -D typescript tsx prisma @types/express @types/jsonwebtoken @types/bcryptjs @types/cors @types/node eslint prettier typescript-eslint
```

**`package.json` scripts**

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc -p tsconfig.json",
  "start": "node dist/server.js",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "prisma db seed",
  "lint": "eslint src",
  "format": "prettier --write ."
}
```

**`tsconfig.json` essentials**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "src/types/**/*.ts"]
}
```

---

## 3. Architecture — Feature-Based

Each feature is a vertical slice owning its HTTP surface end-to-end. Data-model changes, however, are centralized in Prisma (features coordinate through the schema, not by importing each other).

```mermaid
flowchart TD
    A[Incoming HTTP] --> B[Global middleware<br/>helmet / cors / rate-limiter]
    B --> C[Feature router]
    C --> D[authenticate<br/>JWT verify]
    D --> E[authorize<br/>role guard]
    E --> F[validate<br/>Zod body / query / params]
    F --> G[Controller<br/>HTTP layer only]
    G --> H[Service<br/>business rules]
    H --> I[(Prisma / PostgreSQL)]
    H -- throws ApiError --> J[error-handler<br/>consistent JSON envelope]
    G -.res.json.-> OUT[Client]
```

### 3.1 Directory Structure

```
Server-side/
├── docs/
│   ├── implementation-plan.md
│   └── coding-style.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                  # seeds ADMIN from env
├── src/
│   ├── server.ts                # bootstrap: env check → app → listen (kept separate for tests)
│   ├── app.ts                   # Express app factory: middleware chain + router mount
│   ├── config/
│   │   └── env.ts               # Zod-validated env; ONLY process.env access point
│   ├── db/
│   │   └── prisma.ts            # PrismaClient singleton
│   ├── lib/                     # framework-agnostic helpers (shared)
│   │   ├── errors.ts            # ApiError + error codes
│   │   ├── jwt.ts               # sign / verify access tokens
│   │   ├── password.ts          # hash / compare (bcryptjs)
│   │   └── repo-url.ts          # repo URL normalization (duplicate rule)
│   ├── middlewares/             # shared cross-feature middleware
│   │   ├── authenticate.ts      # Bearer verify → req.user
│   │   ├── authorize.ts         # authorize('MENTOR') role guard
│   │   ├── validate.ts          # Zod parse middleware (body/query/params)
│   │   ├── rate-limiter.ts      # named limiters: global / auth / submit
│   │   ├── error-handler.ts     # central ApiError → JSON
│   │   └── not-found.ts         # 404 for unmatched /api routes
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts
│   │   ├── submissions/
│   │   │   ├── submission.routes.ts
│   │   │   ├── submission.controller.ts
│   │   │   ├── submission.service.ts
│   │   │   └── submission.schema.ts
│   │   └── review/
│   │       ├── review.routes.ts
│   │       ├── review.controller.ts
│   │       ├── review.service.ts
│   │       └── review.schema.ts
│   └── types/
│       ├── express.d.ts         # Request.user augmentation
│       └── http.ts              # success envelope typing
├── .env.example
├── .gitignore                   # includes .env
├── package.json
└── tsconfig.json
```

**Dependency direction** (enforced by review):

```
features/* → { middlewares/*, lib/*, db/*, config/* }   allowed
features/A → features/B                                  forbidden
middlewares/* → features/*                               forbidden
shared/* → features/*                                    forbidden
```

---

## 4. Prisma Schema

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  STUDENT
  MENTOR
  ADMIN
}

enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id           String             @id @default(cuid())
  name         String
  email        String             @unique
  passwordHash String
  role         Role               @default(STUDENT)
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  submissions  Submission[]       @relation("StudentSubmissions")
  feedbacks    Feedback[]

  @@map("users")
}

model Submission {
  id          String           @id @default(cuid())
  studentId   String
  student     User             @relation("StudentSubmissions", fields: [studentId], references: [id], onDelete: Cascade)
  projectName String
  repoUrl     String           @db.VarChar(2048)
  liveUrl     String?          @db.VarChar(2048)
  description String           @db.VarChar(4000)
  status      SubmissionStatus @default(PENDING)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  feedbacks   Feedback[]

  @@unique([studentId, repoUrl], map: "student_repoUrl_unique")
  @@index([status, createdAt])
  @@index([studentId, createdAt])
  @@map("submissions")
}

model Feedback {
  id           String     @id @default(cuid())
  submissionId String
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  mentorId     String
  mentor       User       @relation(fields: [mentorId], references: [id], onDelete: Cascade)
  comment      String
  createdAt    DateTime   @default(now())

  @@index([submissionId])
  @@map("feedback")
}
```

Schema decisions:

| Decision | Detail |
|---|---|
| Duplicate rule | `@@unique([studentId, repoUrl])` — one repo URL per student (the documented rule required by §4.2). Uses the **normalized** repo URL, so P2002 violations surface a clean `409 DUPLICATE_SUBMISSION`. |
| Normalized storage | `repoUrl` is stored post-normalization (see §6.2) so the unique index is meaningful. |
| `liveUrl` optional | Not every project has a deployment; uniqueness is intentionally not applied to it. |
| Stat-optimized index | `@@index([status, createdAt])` serves filtered + paginated dashboard queries and the stats `COUNT`s. |
| Access log | `@@index([studentId, createdAt])` serves the "my submissions" list. |

---

## 5. Shared Infrastructure

### 5.1 `config/env.ts`

Single point that reads `process.env`, validates it with Zod at startup, and exports a typed `env`. Fails fast at boot for missing required variables.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `PORT` | no (default 4000) | HTTP listen port |
| `JWT_SECRET` | yes | HMAC secret, ≥ 32 chars enforced in code |
| `JWT_EXPIRES_IN` | no (default `7d`) | Access-token TTL |
| `BCRYPT_SALT_ROUNDS` | no (default 12) | Hash cost |
| `CORS_ORIGIN` | yes | Exact allowed origin, e.g. `http://localhost:3000` |
| `RATE_LIMIT_AUTH_MAX` | no (default 10) | Login/signup attempts per window |
| `RATE_LIMIT_SUBMIT_MAX` | no (default 5) | Submissions per window |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seed only | Credentials for the seeded admin |
| `NODE_ENV` | no (default `development`) | |

### 5.2 `db/prisma.ts`

Singleton `new PrismaClient()` exported once; imported by services. (Dev nicety: record-query logging.)

### 5.3 `lib/errors.ts`

```ts
export type ApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'ROLE_FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_SUBMISSION'
  | 'INVALID_STATUS_TRANSITION'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL';

export class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly code: ApiErrorCode) {
    super(message);
  }
}
```

Every service failure that the client should see is `throw new ApiError(...)`; the central error handler renders it. Mapping used throughout:

| Status | When | Typical code |
|---|---|---|
| 400 | Zod validation failure | `VALIDATION_ERROR` |
| 401 | Missing / expired / malformed token | `AUTH_REQUIRED` / `AUTH_INVALID` |
| 403 | Role lacks permission (student on mentor route) | `ROLE_FORBIDDEN` |
| 404 | Submission not found | `NOT_FOUND` |
| 409 | Duplicate submission rule violated | `DUPLICATE_SUBMISSION` |
| 422 | Not accepting `PENDING → APPROVED/REJECTED` on an already-reviewed item | `INVALID_STATUS_TRANSITION` |
| 429 | Rate limit tripped | `RATE_LIMITED` |
| 500 | Unhandled failure (server-side only) | `INTERNAL` |

### 5.4 Middlewares (precise contracts)

| Middleware | Contract |
|---|---|
| `authenticate` | Expects `Authorization: Bearer <token>`. Verifies **signature and expiry**; attaches `req.user = { id, role }`. 401 on missing/invalid/expired token. |
| `authorize(...roles: Role[])` | After `authenticate`; 403 unless `req.user.role ∈ roles`. |
| `validate({ body?, query?, params? })` | Parses with Zod, **strips unknown keys**, replaces `req.body/query/params` with parsed values. On failure → 400 with `details: [{ path, message }]`. Pagination schemas use `z.coerce` for numeric query params. |
| `rate-limiter` | Named factory instances: `globalLimiter` (app-wide, generous), `authLimiter` (login/signup), `submitLimiter` (submission creation). Keyed by IP or authenticated `user.id` when present. |
| `error-handler` | Renders `ApiError`; safety-maps `ZodError → 400` and Prisma `P2002 → 409` (defense in depth); anything else → 500 `INTERNAL` with a generic message (details logged server-side only). |
| `not-found` | Unmatched `/api/**` → 404 envelope. |

### 5.5 `types/express.d.ts`

```ts
import type { Role } from '@/types/role'; // mirrored Prisma enum literals

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
```

Assignment `req.user = { id, role }` happens **only** inside `authenticate`.

---

## 6. Feature Specs

### 6.1 Feature: `auth`

**Endpoints (mounted at `/api/auth`):**

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/signup` | public | Student registration |
| POST | `/login` | public | Login (any role) |

**`signup` flow (service):**
1. Validate with `signupSchema` (`name`, `email`, `password` — min 8, letter+number required).
2. Normalize email: trim + lowercase.
3. **Register only `Role.STUDENT`** — mentor/admin roles are never client-suppliable.
4. Reject duplicate email → 409 (email pre-check + catch Prisma `P2002` fallback).
5. Hash password (`bcryptjs`), create user, issue token.

Request / success response:

```json
// request
{ "name": "Amina Rai", "email": "amina@example.com", "password": "Submitlly#2026" }
// 201
{ "success": true, "data": { "user": { "id": "…", "name": "Amina Rai", "email": "amina@example.com", "role": "STUDENT", "createdAt": "…" }, "token": "eyJ…" } }
```

**`login` flow (service):**
1. Validate `loginSchema` (`email`, `password`).
2. Lookup user by normalized email; compare bcrypt hash.
3. Invalid credentials → **401** with generic message; no user-existence disclosure.
4. Return `{ user, token }`.

**Token:** `payload = { sub: user.id, role }`; signed from `env.JWT_SECRET`; TTL `env.JWT_EXPIRES_IN` (default `7d`). Signature + expiration enforced by `authenticate` on every protected route.

### 6.2 Feature: `submissions` (Student Portal)

**Endpoints (mounted at `/api/submissions`):**

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/` | `STUDENT` | Create submission |
| GET | `/me` | `STUDENT` | List own submissions |

**Create flow (service):**
1. `validate(createSubmissionSchema)`:
   - `projectName` 3–120 chars
   - `repoUrl` must be a valid URL
   - `liveUrl` optional, valid URL if present
   - `description` 10–4000 chars
2. **Normalize `repoUrl`** → trim, strip `#hash` / `?query`, drop trailing `/`, preserve case → stored value also used in the unique index.
3. Enforce duplicate rule via the `(studentId, repoUrl)` composite unique; a collision (surfaced as Prisma `P2002`) → **409 `DUPLICATE_SUBMISSION`**.
4. Created submission is always `status: "PENDING"`.
5. `submitLimiter` applies **before** validation (per `user.id`).

Request → success:

```json
// request
{
  "projectName": "Trip Recommender API",
  "repoUrl": "https://github.com/amina/trip-recommender-api",
  "liveUrl": "https://trip-recommender.vercel.app",
  "description": "Suggests city trips from user notes using an LLM ranking pipeline."
}
// 201
{ "success": true, "data": { "submission": { "id": "…", "studentId": "…", "projectName": "Trip Recommender API", "repoUrl": "https://github.com/amina/trip-recommender-api", "liveUrl": "https://trip-recommender.vercel.app", "description": "…", "status": "PENDING", "createdAt": "…", "updatedAt": "…" } } }
```

409 example (documented response):

```json
{ "success": false, "message": "You have already submitted a project with this repository URL.", "code": "DUPLICATE_SUBMISSION" }
```

**List my submissions:** returns newest first, scoped by `req.user.id` from the token; shape `{ items: Submission[], total }`.

**Ownership rule:** only the owning student (or an authorized reviewer) may read/change any given submission — filters always use `studentId = req.user.id`.

### 6.3 Feature: `review` (Mentor Dashboard)

**Endpoints (mounted at `/api/mentor`):**

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/submissions` | `MENTOR`, `ADMIN` | Paginated list with server-side status filter |
| PATCH | `/submissions/:id/status` | `MENTOR`, `ADMIN` | Approve / reject a submission |
| GET | `/stats` | `MENTOR`, `ADMIN` | Aggregate statistics |

**Paginated list (service):** `page` (default 1), `limit` (default 10, max 50), `status` (`PENDING|APPROVED|REJECTED`, optional).

```json
// GET /api/mentor/submissions?page=2&limit=10&status=APPROVED
{
  "success": true,
  "data": {
    "items": [ { "id": "…", "projectName": "…", "repoUrl": "…", "status": "APPROVED", "student": { "name": "…", "email": "…" }, "createdAt": "…" } ],
    "page": 2,
    "limit": 10,
    "total": 27,
    "totalPages": 3
  }
}
```

**Status update (service) — `PATCH /submissions/:id/status`:**

1. `validate` body: `{ "status": "APPROVED" | "REJECTED", "comment": string? }`.
2. Load submission by `id` → **404** if missing.
3. **Transition rule:** only `PENDING → APPROVED | REJECTED`. Updating an already-reviewed submission → **422 `INVALID_STATUS_TRANSITION`** (documented; prevents accidental overwrites).
4. `transaction`: update status; if `comment` provided, create a `Feedback` row attributed to `req.user.id`.
5. Returns the updated submission (200).

```json
// request
{ "status": "APPROVED", "comment": "Solid architecture; tests passing." }
// 200
{ "success": true, "data": { "submission": { "id": "…", "status": "APPROVED", "updatedAt": "…" } } }
```

**Stats (service):** single Prisma `GROUP BY` on `status`:

```json
// GET /api/mentor/stats
{ "success": true, "data": { "stats": { "total": 120, "pending": 43, "approved": 68, "rejected": 9 } } }
```

Exceeds the minimum bar by including `rejected`; `total` = sum of all three.

---

## 7. API Contract & Conventions (global)

**Success envelope** — `{ "success": true, "data": <payload> }`
**Error envelope** — `{ "success": false, "message": <human-readable>, "code"?: <ApiErrorCode>, "details"?: [...] }`

Sample error with validation details:

```json
{
  "success": false,
  "message": "Validation failed.",
  "code": "VALIDATION_ERROR",
  "details": [
    { "path": "repoUrl", "message": "Invalid URL" },
    { "path": "description", "message": "String must contain at least 10 character(s)" }
  ]
}
```

Route summary:

| Method | Route | Access | Feature |
|---|---|---|---|
| GET | `/api/health` | public | infra |
| POST | `/api/auth/signup` | public | auth |
| POST | `/api/auth/login` | public | auth |
| POST | `/api/submissions` | STUDENT | submissions |
| GET | `/api/submissions/me` | STUDENT | submissions |
| GET | `/api/mentor/submissions` | MENTOR, ADMIN | review |
| PATCH | `/api/mentor/submissions/:id/status` | MENTOR, ADMIN | review |
| GET | `/api/mentor/stats` | MENTOR, ADMIN | review |

**App mounting** (a feature exports a barrel):

```ts
app.use('/api/auth', authFeatureRouter);
app.use('/api/submissions', submissionsFeatureRouter);
app.use('/api/mentor', reviewFeatureRouter);
```

Per-route wiring pattern (canonical shape every feature follows):

```ts
router.post(
  '/',
  authenticate,
  authorize('STUDENT'),
  submitLimiter,
  validate({ body: createSubmissionSchema }),
  submissionController.create,
);
```

**Requirement-driven RBAC check** (testing checklist §10): a STUDENT token hitting `/api/mentor/*` receives **403 `ROLE_FORBIDDEN`** — enforced here, never "hidden UI".

---

## 8. Security & Reliability Checklist

| Requirement (§6) | Implementation in this plan |
|---|---|
| Server-side validation for all data | Zod `validate` middleware on every mutating / filtered route |
| Normalize + validate emails | Trim + lowercase in auth service; `z.string().toLowerCase()` in schema |
| Password hashing, never plaintext | `bcryptjs` (12 rounds) |
| JWT signature + expiration verified | `authenticate` middleware on all protected routes |
| Permissions enforced on server | `authorize` role guards; no client-reported role |
| Access verified per submission | Update via `id` +404; student scoping by `req.user.id` |
| Duplicate prevention with documented rule | `(studentId, normalized repoUrl)` composite unique → 409 |
| Rate limiting on auth + submissions | `authLimiter`, `submitLimiter` (configurable via env) |
| Correct HTTP status codes + clear errors | Global status/error-code table (§5.3) |
| Secrets in env, `.env` never committed | `env.ts` validation + `.env.example` + `.gitignore` |
| Loading/empty/error states on the client | Backend guarantees consistent envelopes that make these states deterministic |

---

## 9. Build Phases

### Outlet 1 — Project Setup
- [ ] `npm init`, install runtime + dev deps, Express 5
- [ ] `tsconfig.json` with `strict: true, exactOptionalPropertyTypes: true`; `@/` path aliases
- [ ] ESLint (typescript-eslint) + Prettier; `.gitignore` (env + dist)
- [ ] `src/server.ts` + `src/app.ts` skeleton; `GET /api/health`
- [ ] `.env.example` with every variable documented

### Outlet 2 — Schema & shared infrastructure
- [ ] Prisma schema modelled + indexes per §4
- [ ] `prisma migrate dev --name init_submittly`
- [ ] `db/prisma.ts`; `config/env.ts`; `types/express.d.ts` (`req.user`)
- [ ] `lib/` (`errors.ts`, `password.ts`, `jwt.ts`, `repo-url.ts`)
- [ ] `middlewares/` (`authenticate`, `authorize`, `validate`, `rate-limiter`, `error-handler`, `not-found`)
- [ ] `app.ts` composing middleware chain exactly in order (json → helmet → cors → globalLimiter → routes → notFound → errorHandler)

### Outlet 3 — Feature: `auth`
- [ ] `auth.schema.ts` (signup, login + inferred types)
- [ ] `auth.service.ts` (bcrypt, 409 email, 401 generic login failure, STUDENT-only signup)
- [ ] `auth.controller.ts`, `auth.routes.ts` with `authLimiter`
- [ ] Smoke: `curl` signup/login → 201/200; bad password → 401

### Outlet 4 — Feature: `submissions`
- [ ] `submission.schema.ts`; `repo-url.ts` normalization
- [ ] `submission.service.ts` (create with 409 P2002 mapping; list via `req.user.id`)
- [ ] Routes wired `authenticate → authorize('STUDENT') → submitLimiter → validate`
- [ ] Smoke: create → 201; duplicate → 409; mentor token on route → 403

### Outlet 5 — Feature: `review`
- [ ] `review.schema.ts` (list query, status patch)
- [ ] `review.service.ts` (paginated server-filtered list, 422-barred transitions, transactional update + comment, `GROUP BY` stats)
- [ ] Routes wired `authenticate → authorize('MENTOR','ADMIN') → validate`
- [ ] Smoke: filter + page flags; approve one submission; stats reflect it

### Outlet 6 — Hardening, seeding & clean-up
- [ ] `prisma/seed.ts` creating ADMIN from `ADMIN_EMAIL`/`ADMIN_PASSWORD` (always `prisma db seed`)
- [ ] Final error-shape audit (each route maps to the envelope contract)
- [ ] README update: setup, env docs, endpoint list, curl examples
- [ ] ESLint/Prettier clean; TS `strict` compiles with no errors

### Outlet 7 — Testing & acceptance
- [ ] Jest + Supertest setup (app factory opens without `listen`)
- [ ] Map each item of `Requirements §10 Testing Checklist` to a test case
- [ ] Positive/negative/auth/rate-limit suites for every feature
- [ ] Postman collection exported for demo use
- [ ] Acceptance: every requirement checklist item passes

---

## 10. Open Decisions Log

| # | Area | Decision | Notes |
|---|---|---|---|
| 1 | Duplicate rule | Unique `(studentId, normalized repoUrl)` | Required doc decision in `Requirements §4.2` |
| 2 | Re-review | `PENDING → APPROVED/REJECTED` only; a completed review cannot be mutated by the same endpoint (422) | Prevents accidental overrides |
| 3 | `liveUrl` | Optional | No uniqueness on it |
| 4 | Signup roles | Students only self-register | Mentors/admin created by seed (allowed per `Requirements §3`) |
| 5 | Feedback | Optional `comment` can accompany approve/reject; plain review allowed without comment | |
| 6 | Stats surface | `total`, `pending`, `approved`, `rejected` | Superset of the required minimum |
| 7 | Pagination | `page` ≥ 1, `limit` 5–50 (default 10) via `z.coerce` | |
| 8 | Auth response envelope | `{ user, token }` returned on signup and login | |
