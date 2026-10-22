# Submittly — Backend Coding Style Guide

> Companion doc: [implementation-plan.md](./implementation-plan.md)
> Scope: `Server-side/` source code. Frontend conventions live elsewhere.

This guide is **binding for every PR or commit**. Prettier and ESLint enforce mechanical rules automatically; everything else is enforced review-time.

---

## 1. TypeScript

- `strict: true` and `exactOptionalPropertyTypes: true` are compile-enforced.
- **`any` is banned** (ESLint rule). Use `unknown` when a type is genuinely unknown and narrow it.
- Every exported function has an explicit return type.
- Types are **inferred from Zod schemas** — do not hand-duplicate request shapes:

  ```ts
  // ✅ single source of truth
  export const createSubmissionSchema = z.object({
    projectName: z.string().trim().min(3).max(120),
    repoUrl: z.url(),
    liveUrl: z.url().optional(),
    description: z.string().trim().min(10).max(4000),
  });
  export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
  ```

- Prefer `type` over `interface` unless augmenting (`types/express.d.ts`; there `interface` is required).
- Never `as Type`-cast to silence the compiler; if you truly must, leave a comment on **why** and how the invariant holds.
- Use `import { type Foo }` (inline type modifier) for type-only imports.

---

## 2. Naming

| Item                       | Convention                                                   | Example                                                     |
| -------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| Files                      | `kebab-case`                                                 | `auth.service.ts`, `repo-url.ts`                            |
| Directories                | `kebab-case`, feature names single-worded when possible      | `auth/`, `submissions/`, `review/`                          |
| Types / interfaces / enums | `PascalCase`; no `I` prefix                                  | `CreateSubmissionInput`                                     |
| Enum values                | `UPPER_SNAKE_CASE`                                           | `SubmissionStatus.APPROVED`                                 |
| Functions / variables      | `camelCase`; action-verb prefix                              | `createSubmission`, `listMySubmissions`, `normalizeRepoUrl` |
| Controllers                | named per HTTP intent                                        | `create`, `list`, `updateStatus`, `stats`                   |
| Boolean variables          | `is/has/can` prefix                                          | `isReviewed`, `canTransition`                               |
| Constants                  | `UPPER_SNAKE_CASE`                                           | `DEFAULT_PAGE_SIZE`                                         |
| Zod schemas                | camelCase + `Schema` suffix                                  | `loginSchema`, `listSubmissionsQuerySchema`                 |
| Schemas’ inferred types    | PascalCase + `*Input` (write) / `*Query` (list/read)         | `SignupInput`, `UpdateStatusInput`, `ListSubmissionsQuery`  |
| API routes                 | lowercase, plural nouns; verbs only on PATCH action suffixes | `/api/submissions`, `/api/mentor/submissions/:id/status`    |
| Env variables              | `UPPER_SNAKE_CASE`                                           | `JWT_EXPIRES_IN`                                            |

---

## 3. Error Handling

- All intended client-facing failures are `throw new ApiError(status, message, code)` — **never** return error objects and inspect them in controllers.
- Never swallow: no empty `catch`, no `try { ... } catch {/* ignore */}`.
- Controllers hold no `try/catch`. Express 5 rejects unhandled async errors into the central `error-handler` middleware — rely on it.
- **Only** the error handler produces JSON error envelopes:

  ```ts
  // ✅ controller — no try/catch, no manual status juggling
  async list(req: Request, res: Response): Promise<void> {
    const query = listSubmissionsQuerySchema.parse(req.query);
    const result = await reviewService.listSubmissions(query);
    res.status(200).json({ success: true, data: result });
  }
  ```

  ```ts
  // ❌ allowed nowhere
  try {
    /* ... */
  } catch (e) {
    res.status(500).json({ message: 'oops' });
  }
  ```

- Generic `Error` instances reaching `error-handler` are logged with stack and returned as **500 `INTERNAL`** with a generic client-facing message — never leak internals to the client; log details server-side only.
- Services may `throw` Prisma errors; the central handler maps `P2002 → 409`, `ZodError → 400` as safety nets.

---

## 4. Validation Boundaries

- Zod validates at the **first entry point** of user-controlled data: `validate({ body?, query?, params? })` middleware wraps schemas before a controller runs.
- **Express 5 gotcha:** `req.query` is a getter-only property. Middleware that replaces request values must use `Object.defineProperty(req, key, { value, writable: true, configurable: true })` — a plain assignment throws `TypeError: Cannot set property query`.
- After the middleware, controllers may re-`parse` for static types (as above) — this is not duplicate runtime work, it is type-bearing and zero cost at runtime.
- Types for HTTP inputs come exclusively from `z.infer`; no parallel hand-written shape that can drift.
- Never trust `req.body`/`req.query` types without Zod having parsed them.

---

## 5. Layering Rules

Responsibility map (from `implementation-plan.md` §3):

| Layer file        | May do                                                                             | Must not                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `*.routes.ts`     | compose the middleware chain; bind controller                                      | contain business logic, access Prisma                                               |
| `*.controller.ts` | parse request types, call **one** service, shape `res`                             | touch Prisma, hold business rules, `throw` business errors                          |
| `*.service.ts`    | business decisions, `throw new ApiError`, **the only Prisma importer per feature** | call `res.*`, read `req.*` internals (dependency-injected into the service instead) |

Concrete rules:

- A controller calls **exactly one** service function per route.
- A service takes plain values (already-parsed) as parameters, **not** the `Request` object.
- **Controllers expose arrow-function properties**, not object methods, so handlers can be passed straight to the router without an unbound `this` (ESLint `unbound-method`):

  ```ts
  export const authController = {
    signup: async (req: Request, res: Response): Promise<void> => {
      const input = signupSchema.parse(req.body);
      const result = await authService.signup(input);
      res.status(201).json({ success: true, data: result });
    },
  };
  ```

- A route **first** `authenticate`, **then** `authorize(...roles)`, **then** `submitLimiter`/`authLimiter` when applicable, **then** `validate`, **then** controller — always in that order:

  ```ts
  // ✅ canonical ordering (copy this shape for every POST/PATCH route)
  router.post(
    '/',
    authenticate,
    authorize('STUDENT'),
    submitLimiter,
    validate({ body: createSubmissionSchema }),
    submissionController.create,
  );
  ```

---

## 6. Feature Isolation

- A feature imports **only** from `@/lib/*`, `@/middlewares/*`, `@/db/prisma`, `@/config/env`, and its **own** folder.
- **Cross-feature imports are forbidden** (`features/auth` must not import from `features/submissions`, and vice versa).
- Cross-feature **data relationships** express themselves through Prisma relations, never through function calls.
- Shared middleware and helpers import nothing from `features/*`.
- New cross-cutting logic belongs in `lib/` or `middlewares/` — putting feature-specific helpers in shared spots makes the boundary collapse; resist it.

---

## 7. Imports

Order (Prettier/ESLint groups, each group alphabetized):

```ts
// 1. Node built-ins
import { readFile } from 'node:fs/promises';

// 2. External packages
import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';

// 3. Internal aliases
import { prisma } from '@/db/prisma';
import { authenticate } from '@/middlewares/authenticate';
import { Prisma } from '@/generated/prisma/client';

// 4. Same-feature relative
import { submissionService } from './submission.service';
```

- Prefer named exports; **no default exports** except the tiny `app.ts` factory if desired.
- Use `import { type Foo }` for type-only imports.
- Never import the same file via both `@/…` and relative paths.

---

## 8. Formatting & Lint

**Prettier baseline** (`.prettierrc`):

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

**ESLint expectations:** `typescript-eslint` recommended + rules `no-explicit-any`, `no-floating-promises`, `no-misused-promises`, `consistent-type-imports`, `no-unused-vars` (with `argsIgnorePattern: '^_'`).

- Unused parameters are prefixed `_`.
- Never leave commented-out code in a PR — delete it; history is in git.
- Prefer early returns over nesting; max arrow-function indent depth ~3.

---

## 9. HTTP Conventions

**Response shapes:**

- Success: `{ success: true, data: <payload> }`
- Failure: `{ success: false, message: <string>, code?: <ApiErrorCode>, details?: [...] }`

**Status codes as public API semantics** (see `implementation-plan.md` §5.3 for full table):

| Code | Meaning in this codebase                                              |
| ---- | --------------------------------------------------------------------- |
| 200  | Success                                                               |
| 201  | Resource created (`signup`, new submission)                           |
| 400  | Zod validation failure                                                |
| 401  | Unauthenticated (missing/expired/invalid token, or bad login)         |
| 403  | Forbidden role (`ROLE_FORBIDDEN`)                                     |
| 404  | Submission not found                                                  |
| 409  | Duplicate (`DUPLICATE_SUBMISSION`, duplicate email)                   |
| 422  | `INVALID_STATUS_TRANSITION` (already-reviewed item)                   |
| 429  | Rate limit (always from `rate-limiter` middleware, never hand-thrown) |
| 500  | Genuine fault; never hand-thrown for business errors                  |

- Error messages must be **human-readable at the API boundary** in clear, domain-specific language ("You have already submitted a project with this repository URL.").
- They must never leak stack traces, SQL, or internal identifiers to callers.

---

## 10. Prisma Conventions

- **Prisma 7 layout:** the client is generated into `src/generated/prisma` (git-ignored) by the `prisma-client` generator. Import types and the client from `@/generated/prisma/client` — never from `@prisma/client`.
- The connection lives in two places, and nowhere else: `prisma.config.ts` (CLI: migrate/db/studio) and `db/prisma.ts` (runtime: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`).
- The **only** Prisma import in feature code is inside `features/*` service files and `db/prisma.ts`.
- `@@map("snake_case_table")` in Prisma ↔ `camelCase` in TS.
- Always select Prisma transactions for a request which spans several updates (as in the review status-update + optional feedback pairing).
- Read models are narrowed with a `select` clause; every query leverages the indexes defined in `implementation-plan.md` §4 (`status+createdAt`, `studentId+createdAt`).
- Defaults: use `@default(cuid())` for ids, `@default(now())` and `@updatedAt` for timestamps.
- Schema changes go through `prisma migrate dev --name <us_name_snake_case>`; never `db push` on shared branch work.
- After any schema edit run `npm run prisma:generate` (the `postinstall` hook does it automatically) so the generated client and the app types stay in sync.

---

## 11. Environment & Configuration

- `process.env` is read **only inside `config/env.ts`** — all other modules import `env`.
- The one sanctioned exception: `prisma.config.ts` (the Prisma CLI config, outside the app runtime) reads `process.env.DATABASE_URL` directly, because the CLI loads it before any app module exists.
- **Quote any `.env` value containing `#`** — dotenv treats an unquoted `#` as the start of a comment, silently truncating the value (`ChangeMe#2026` → `ChangeMe`). Use `ADMIN_PASSWORD="ChangeMe#2026"`.
- `config/env.ts` validates in keys with a Zod schema at boot and fails loudly for missing required vars.
- `.env` must never be committed; `.env.example` is kept up to date whenever `env.ts` changes.
- Adding a variable follows this strict order: `env.ts` schema → `.env.example` with clear docs → local `.env` in PR description if needed for ops.

---

## 12. Comments & Documentation

- Comments explain **why**, never **what**. If `what` is unclear, rename code.
- Every **exported service function** gets a short JSDoc with `@param` semantics and **which `ApiError`s it throws**:

  ```ts
  /**
   * Creates a submission and enforces the documented duplicate rule
   * (one repo URL per student, normalized before comparison).
   *
   * @throws ApiError 409 DUPLICATE_SUBMISSION    when `(studentId, repoUrl)` already exists
   * @throws ApiError 429 RATE_LIMITED             (from middleware, not here)
   */
  export async function createSubmission(
    studentId: string,
    input: CreateSubmissionInput,
  ): Promise<Submission> {
    /* … */
  }
  ```

- TODOs read `// TODO(2026-10-21): reason and ticket` and get an owner; block progress otherwise.

---

## 13. Asynchrony

- `async/await` exclusively — no `.then` chains, no callbacks.
- `no-floating-promises` is enforced: every async call is `await`-ed or intentionally `void`-ed with a comment (rare in this codebase).
- Long-running work beyond Phase 1 (cron, queues) gets documented in `implementation-plan.md` before appearing in code.

---

## 14. Git & Commits

**Conventional Commits** (`<type>(<scope>): <imperative subject>`), e.g.:

```
feat(auth): signup endpoint with bcrypt hashing and generic 401 login
fix(review): 422 on already-reviewed status transitions
docs(plan): add mentor stats endpoint shape
refactor(lib): extract repo-url normalization into shared helper
```

Types: `feat | fix | refactor | docs | test | chore | perf`.

**Branch naming:** `feat/<area>-<short-title>`, e.g. `feat/review-stats`. One feature/phase per branch; PRs reference the matching Outlet checkbox in the implementation plan.

**PR self-checklist**

- [ ] `npm run lint` and `tsc -p tsconfig.json` pass
- [ ] No `.env`, secrets, or credentials in diffs
- [ ] New env vars documented in `.env.example`
- [ ] Every route maps to the canonical middleware order (§5)
- [ ] Every user-facing error uses an `ApiErrorCode` from §5.3 of the implementation plan

---

## 15. Quick Reference Card

```text
FILE        features/<feature>/<feature>.{routes,controller,service,schema}.ts
LAYER       routes → controller → service → prisma  (nothing skips layers)
VALIDATE    always Zod at the boundary via validate({...}) middleware
ROLES       authenticate → authorize(...roles) → limiter → validate → controller
ERRORS      throw new ApiError(status, msg, code); central handler renders them
ENVELOPE    { success: true, data } | { success: false, message, code?, details? }
IMPORTS     node → external → @/internal → relative; type-only imports inline
NO          any · default exports · res in services · cross-feature imports ·
            process.env outside config/env.ts · hand-rolled error JSON
```
