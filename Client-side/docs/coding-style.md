# Submittly — Frontend Coding Style Guide

> Companion doc: [implementation-plan.md](./implementation-plan.md)
> Scope: `Client-side/` source code. Backend conventions live in [`../../Server-side/docs/coding-style.md`](../../Server-side/docs/coding-style.md).

This guide is **binding for every PR or commit**. Prettier and ESLint enforce mechanical rules automatically; everything else is enforced review-time.

---

## 1. TypeScript

- `strict: true` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are compile-enforced.
- **`any` is banned** (ESLint rule). Use `unknown` when a type is genuinely unknown and narrow it.
- Every exported function has an explicit return type.
- Types are **inferred from Zod schemas** — do not hand-duplicate request shapes:

  ```ts
  // ✅ single source of truth
  export const signupSchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().trim().toLowerCase().pipe(z.email('Please provide a valid email address')),
    password: z.string().min(8).max(72),
  });
  export type SignupInput = z.infer<typeof signupSchema>;
  ```

- Prefer `type` over `interface` unless augmenting a third-party type.
- Never `as Type`-cast to silence the compiler; if you truly must, leave a comment on **why** and how the invariant holds.
- Use `import { type Foo }` (inline type modifier) for type-only imports.
- **`exactOptionalPropertyTypes` means `prop?: string` does not accept `prop={undefined}`.** Declare `prop?: string | undefined` when the caller may legitimately pass `undefined`.

### 1.1 Dates are strings

The API returns Prisma `Date` values, which serialise to ISO strings over JSON. **Client types use `string`, never `Date`.** Parse to a `Date` at the point of formatting and nowhere else.

```ts
export interface Submission {
  createdAt: string; // ISO 8601
  updatedAt: string;
}
```

---

## 2. Naming

| Item                        | Convention                                                     | Example                                      |
| --------------------------- | -------------------------------------------------------------- | -------------------------------------------- |
| Files                       | `kebab-case`                                                   | `submission-form.tsx`, `status-badge.tsx`     |
| Directories                 | `kebab-case`                                                   | `features/review/`, `components/shared/`      |
| Components                  | `PascalCase`                                                   | `SubmissionForm`, `StatsCards`                |
| Page files                  | `page.tsx` inside a route folder                               | `app/mentor/submissions/page.tsx`             |
| Layout files                | `layout.tsx`                                                   | `app/(mentor)/mentor/layout.tsx`              |
| Route handlers              | `route.ts`                                                     | `app/api/backend/[...path]/route.ts`          |
| Hooks                       | `use` + PascalCase                                             | `useLogin`, `useMySubmissions`                |
| Types / interfaces          | `PascalCase`; no `I` prefix                                   | `LoginInput`, `PaginatedSubmissions`          |
| Enum / union values         | `UPPER_SNAKE_CASE`                                             | `PENDING`, `APPROVED`                         |
| Functions / variables       | `camelCase`; action-verb prefix                                | `roleHome`, `formatDate`, `readSession`       |
| Boolean variables           | `is/has/can` prefix                                            | `isPending`, `hasSession`, `canReview`        |
| Constants                   | `UPPER_SNAKE_CASE`                                             | `TOKEN_COOKIE`, `DEFAULT_PAGE_SIZE`           |
| Zod schemas                 | camelCase + `Schema` suffix                                    | `loginSchema`, `createSubmissionSchema`       |
| Schemas' inferred types     | PascalCase + `*Input` (write) / `*Query` (read)                | `LoginInput`, `UpdateStatusInput`             |
| Query-key factories         | `keys.ts` exporting a `<feature>Keys` object                   | `reviewKeys.submissionsList(params)`          |
| API paths                   | lowercase, plural nouns                                        | `/auth/login`, `/mentor/submissions`          |
| Env variables               | `UPPER_SNAKE_CASE`                                             | `API_URL`                                    |
| CSS variables / tokens      | `--kebab-case`                                                 | `--color-muted-foreground`                    |

---

## 3. Server Components by Default

`'use client'` is a **last resort**. It opts a module (and everything it imports) into the browser bundle.

- **Server Component by default** — page shells, layouts, static content, and anything that only reads cookies.
- `'use client'` only where the component genuinely needs browser APIs: forms, tables with filters, dialogs, anything using `useState`/`useEffect`/`useQuery`.
- **Push the boundary down.** A page that renders a client form should be a Server Component that imports a client child — not a page that is itself `'use client'`.

  ```tsx
  // ✅ app/(student)/student/submissions/new/page.tsx  — Server Component
  import { SubmissionForm } from '@/features/submissions/components/submission-form';

  export default function NewSubmissionPage() {
    return (
      <PageHeader title="Submit a project" description="…" />
      <SubmissionForm />
    );
  }
  ```

- **Never** put `'use client'` on a file that only exports types, constants, or pure functions — those belong in a plain `.ts` module and stay out of the client bundle entirely.
- Do not import a server-only module (`import 'server-only'`) into a client component. `src/lib/session.ts` is server-only by design.

---

## 4. Component Structure

- **One component per file**, named after the file. A file exporting three components is a file nobody can find things in.
- **Props are typed and explicit.** Every component has a props interface with explicit types.

  ```tsx
  interface StatusBadgeProps {
    status: SubmissionStatus;
  }

  export function StatusBadge({ status }: StatusBadgeProps) {
    return <Badge variant={variantFor(status)}>{labelFor(status)}</Badge>;
  }
  ```

- **Prefer `type` over `interface`** for props; use `interface` only when augmenting a third-party type.
- **Keep components small.** A component that needs scrolling to understand is two components.
- **Compose, don't configure.** A component with six boolean props becomes six components.
- Presentational components (`components/shared/`) receive data via props and own no fetching. Container components (feature components) own the data and pass it down.
- **Feature-specific components live in `features/<feature>/components/`**, never in `components/shared/`. `components/shared/` is for genuinely app-wide composites.
- **shadcn files in `src/components/ui/` are generated — never edit them by hand.** Customise via the `components.json` aliases, wrap them in `components/shared/` or `components/features/`, or add a `cva` variant in a separate file.

### 4.1 Feature folder anatomy

```
features/<feature>/
├── api.ts        # the feature's API calls (one function per endpoint)
├── keys.ts       # query-key factory
├── schemas.ts    # Zod schemas + inferred types
├── types.ts      # feature-specific types not covered by @/types/api
├── components/   # .tsx only
└── hooks/        # use*.ts only
```

A folder gains a new top-level file only when it earns it. Four small files beat one large one; ten files beat neither.

---

## 5. Forms & Validation

- **react-hook-form** for state, **`zodResolver`** for validation. No hand-rolled controlled-input state.
- The Zod schema lives in `features/<feature>/schemas.ts` and is the single source of truth for the form's shape.
- **Client validation is UX, never security.** The server re-validates everything (Requirements §6). Never rely on a client check to prevent anything.
- Validation modes: `onBlur` for text fields, `onSubmit` for the form.

  ```tsx
  const form = useForm<CreateSubmissionInput>({
    resolver: zodResolver(createSubmissionSchema),
    defaultValues: { projectName: '', repoUrl: '', liveUrl: '', description: '' },
  });
  ```

- **Server-side `details[]` map onto fields by `path`.** The API returns `{ path, message }` pairs; use the `path` as the field name.

  ```tsx
  useEffect(() => {
    if (error instanceof ApiError && error.details) {
      for (const detail of error.details) {
        form.setError(detail.path as keyof CreateSubmissionInput, { message: detail.message });
      }
    }
  }, [error, form]);
  ```

- **A failed submit never clears the form.** The user's input is the most expensive thing on the screen.
- Disable the submit button while the mutation is pending, and show a spinner. Never allow double submits.
- Every input has a `<Label>` bound with `htmlFor`, and every error has `aria-describedby` pointing at the message.

---

## 6. Data Fetching & Server State

- **TanStack Query owns all server state.** `useQuery` for reads, `useMutation` for writes.
- **Never fetch in `useEffect`.** If you are writing `useEffect(() => { fetch(...) }, [])`, the wrong tool is in your hand.
- **Query keys come from the feature's key factory** — never an inline string. Inline keys drift and silently break invalidation.

  ```ts
  export const reviewKeys = {
    all: ['review'] as const,
    submissions: () => [...reviewKeys.all, 'submissions'] as const,
    submissionsList: (params: ListParams) => [...reviewKeys.submissions(), 'list', params] as const,
    stats: () => [...reviewKeys.all, 'stats'] as const,
  };
  ```

- **Every key includes every input that changes the result.** A `status` filter missing from the key returns stale data for the wrong filter.
- **Mutations invalidate, they do not patch.** After a write, invalidate the affected keys and let the query refetch:

  ```ts
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: reviewKeys.submissions() });
    queryClient.invalidateQueries({ queryKey: reviewKeys.stats() });
  },
  ```

- `useMutation`'s `onSuccess` may also update the cache directly, but only for data the mutation returns.
- Use `placeholderData: keepPreviousData` when paginating, so the table does not flash empty between pages.
- **Every query view renders four states**: loading, error, empty, and success. A view that only handles success is incomplete.
- On login or logout, call `queryClient.clear()` — a new identity must not inherit the previous user's cached data.

---

## 7. Error Handling

- **All API calls go through `apiFetch`** (`src/lib/api-client.ts`). Nothing calls `fetch` against the backend directly.
- `apiFetch` unwraps the envelope and **throws `ApiError`** on failure. Callers never inspect `response.ok` or parse envelopes by hand.

  ```ts
  try {
    const list = await apiFetch<SubmissionList>('/submissions/me');
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.message); // the API's message is already human-readable
    }
  }
  ```

- **Show the API's `message` verbatim.** The backend writes domain-specific, user-safe copy ("You have already submitted a project with this repository URL."). Do not replace it with generic text when a message is present.
- **Never leak internals.** Stack traces, SQL, and identifiers never reach the UI.
- **Never swallow an error.** An empty `catch` is a bug; `catch { /* ignore */ }` is worse. Handle it or let it propagate to an `error.tsx` boundary.
- **Client-side errors are not a security control.** Hiding the Approve button does not stop a student calling the API — the server returns `403`. Both are required; neither replaces the other.

### 7.1 Error boundaries

Each route group gets an `error.tsx`:

```tsx
'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      title="Something went wrong"
      description="We couldn't load this page. Please try again."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
```

---

## 8. Styling

**Tailwind CSS v4** is configured in CSS (`src/app/globals.css`). There is **no `tailwind.config.js`**.

- Use **semantic tokens**, never raw colours: `bg-background`, `text-muted-foreground`, `border-border`, `text-destructive`. Raw `bg-[#1a1a1a]` is banned — it cannot follow dark mode.
- Custom colours are added as CSS variables in `globals.css` and exposed through `@theme inline`.
- **Never hard-code spacing or colour values that already exist as a token.** `p-4`, not `p-[16px]`.
- Layout uses Tailwind's spacing scale; spacing is consistent because the scale is consistent.
- **shadcn/ui components are the base.** Reach for the existing primitive before writing a new one.
- Customise with `cva` variants in a wrapper — never by editing `src/components/ui/*.tsx`.

  ```tsx
  // components/features/submission-status.tsx
  const badgeVariants = cva('rounded-full px-2 py-0.5 text-xs font-medium', {
    variants: {
      status: {
        PENDING: 'bg-muted text-muted-foreground',
        APPROVED: 'bg-primary text-primary-foreground',
        REJECTED: 'bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: { status: 'PENDING' },
  });
  ```

- Use `cn()` from `@/lib/utils` to merge class names — it resolves Tailwind conflicts correctly (`cn('p-2', 'p-4')` → `p-4`).
- **Icons come from `lucide-react`.** Do not add another icon library.
- Respect `prefers-reduced-motion`; avoid gratuitous animation.
- Dark mode is class-based (`next-themes`, `attribute="class"`). Never hard-code `dark:` variants that ignore the theme.

### 8.1 Prettier baseline (`.prettierrc`)

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "semi": true,
  "jsxSingleQuote": false,
  "trailingComma": "all",
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

`prettier-plugin-tailwindcss` sorts class names automatically — do not hand-sort them, and do not fight the plugin.

---

## 9. Accessibility

- **Every input has a visible label.** Placeholder text is not a label.
- **Every icon-only button has an accessible name** — `<Button aria-label="Approve submission">` or a visually hidden `<span className="sr-only">`.
- **Semantic HTML first.** `<button>`, `<a href>`, `<table>`, `<th scope="col">`, `<nav>`, `<main>`. A `<div onClick>` is never acceptable.
- **Focus is always visible.** Never `outline-none` without a replacement.
- **Keyboard operability.** Dialogs, dropdowns, and tables must be fully usable without a mouse. shadcn/Radix primitives give this for free — do not reimplement them.
- **Colour is never the only signal.** The status badge carries a text label as well as a colour.
- **Announce dynamic changes** — use `aria-live="polite"` for toasts and result counts.
- Images and icons that carry meaning get `alt` or `aria-hidden` appropriately.

---

## 10. Imports & Module Boundaries

Order (Prettier/ESLint groups, each group alphabetised):

```ts
// 1. External packages
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 2. Internal aliases
import { apiFetch } from '@/lib/api-client';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Submission } from '@/types/api';

// 3. Same-feature relative
import { createSubmissionSchema } from './schemas';
```

- Prefer named exports; **no default exports** for components or helpers. (`export default` is required by Next.js for `page.tsx` and `layout.tsx` — that is the only exception.)
- Use `import { type Foo }` for type-only imports.
- Never import the same file via both `@/…` and a relative path.

### 10.1 Boundary rules

```
features/* → { lib/*, components/shared/*, types/* }     allowed
features/A → features/B                                   forbidden
components/shared → features/*                            forbidden
components/ui → features/*                                forbidden
app/(student) → features/mentor                           forbidden
app/(mentor)  → features/student                          forbidden
```

- **Cross-feature imports are forbidden.** If two features need the same code, it belongs in `lib/` or `components/shared/`.
- **Persona boundaries are as hard as feature boundaries.** The mentor shell never imports a student component, and vice versa.
- Shared code imports nothing from `features/*`.
- `src/lib/session.ts` is `import 'server-only'` — it must never be pulled into a client bundle.

---

## 11. Formatting & Lint

- **Prettier owns formatting.** Do not hand-format; run `npm run format`. If Prettier and you disagree, Prettier wins.
- **ESLint** (`eslint-config-next` + `typescript-eslint` recommendedTypeChecked) must be clean. Rules to expect:
  - `@typescript-eslint/no-explicit-any` — error
  - `@typescript-eslint/no-floating-promises` — error
  - `@typescript-eslint/consistent-type-imports` — error, inline type modifier
  - `@typescript-eslint/no-unused-vars` — error, `argsIgnorePattern: '^_'`
  - `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` — error
  - `jsx-a11y/*` — error
- Unused parameters are prefixed `_`.
- **Never leave commented-out code in a PR** — delete it; history is in git.
- Prefer early returns over nesting; max arrow-function indent depth ~3.
- `npm run lint`, `npm run typecheck`, and `npm run build` must all pass before a PR is opened.

---

## 12. Environment & Configuration

- **`API_URL` is server-only.** It is read exclusively by the proxy route and never prefixed with `NEXT_PUBLIC_`. It never reaches the browser bundle.
- **Anything prefixed `NEXT_PUBLIC_` is public.** A secret in a `NEXT_PUBLIC_` variable is a published secret. There is currently no `NEXT_PUBLIC_` variable in this app, and adding one requires a security review.
- `.env` must never be committed; `.env.example` documents every variable and is kept up to date.
- Adding a variable follows this order: `.env.example` with clear docs → local `.env` → usage.

  | Variable   | Required | Purpose                                       |
  | ---------- | -------- | --------------------------------------------- |
  | `API_URL`  | yes      | Base URL of the Express API, e.g. `http://localhost:4000` |

- Next.js exposes `process.env.NEXT_PUBLIC_*` at build time — a value changed after the build has no effect. Document this in `.env.example` when adding one.
- `next.config.ts` holds only genuinely build-time configuration. Runtime configuration comes from the environment.

---

## 13. Comments & Documentation

- Comments explain **why**, never **what**. If the `what` is unclear, rename the code.
- **Every exported hook and non-trivial component** gets a short JSDoc describing what it does and what it returns.

  ```tsx
  /**
   * Paginated, server-side filtered submissions for the mentor dashboard.
   * `status` is applied by the API — the client never filters locally.
   */
  export function useSubmissions(params: ListParams) {
    // …
  }
  ```

- TODOs read `// TODO(2026-10-22): reason and ticket` and get an owner; block progress otherwise.
- **Do not comment out code.** Delete it.

---

## 14. Asynchrony

- **async/await** exclusively — no `.then` chains, no callbacks.
- `no-floating-promises` is enforced: every async call is `await`-ed, returned, or explicitly `void`-ed with a comment.
- **Never `await` inside a `useEffect` to trigger navigation.** Compute first, then navigate in the handler or in the mutation's `onSuccess`.
- **Navigation happens in the mutation's `onSuccess`,** not in the component that fired it:

  ```tsx
  const { mutate, isPending } = useCreateSubmission();

  function onSubmit(values: CreateSubmissionInput) {
    mutate(values, { onSuccess: () => router.push('/student/dashboard') });
  }
  ```

- Long-running work is out of scope for this app.

---

## 15. Git & Commits

**Conventional Commits** (`<type>(<scope>): <imperative subject>`), e.g.:

```
feat(auth): student signup form with server-side error mapping
fix(review): keep table rows while paginating with placeholderData
docs(plan): add mentor stats endpoint shape
refactor(submissions): extract status badge into shared components
```

Types: `feat | fix | refactor | docs | test | chore | perf`.

**Branch naming:** `feat/<area>-<short-title>`, e.g. `feat/review-dashboard`. One feature/outlet per branch; PRs reference the matching Outlet checkbox in the implementation plan.

**PR self-checklist**

- [ ] `npm run lint`, `npm run typecheck`, and `npm run build` pass
- [ ] No `.env`, secrets, or credentials in diffs
- [ ] New env vars documented in `.env.example`
- [ ] Every data view renders loading, empty, error, and success states
- [ ] No `'use client'` added to a file that does not need it
- [ ] Query keys come from the feature's key factory
- [ ] Client Zod schemas still match the server's rules
- [ ] No `any`, no default exports outside `page.tsx` / `layout.tsx`
- [ ] Keyboard navigation and labels verified on new interactive elements

---

## 16. Quick Reference Card

```text
COMPONENT   Server by default; 'use client' only on interactive islands
FILE        features/<feature>/{api,keys,schemas,types}.ts + components/ + hooks/
FETCH       apiFetch('/path') — never raw fetch; never useEffect
KEYS        <feature>Keys.factory(...) — never inline strings
STATE       TanStack Query for server state; useState for local UI only
VALIDATE    Zod + zodResolver; client validation is UX, server is truth
ERRORS      apiFetch throws ApiError; show error.message; never swallow
STATES      every view: loading · empty · error · success
STYLE       semantic tokens (bg-background); no raw colours; cn() to merge
A11Y        real labels · semantic HTML · visible focus · no colour-only meaning
IMPORTS     external → @/internal → relative; type-only inline
BOUNDARY    features/A → features/B forbidden; student ⇄ mentor forbidden
NO          any · raw fetch · useEffect fetching · editing components/ui/* ·
             default exports (except page/layout) · hard-coded colours ·
             secrets in NEXT_PUBLIC_ vars
```
