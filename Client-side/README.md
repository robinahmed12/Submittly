# Submittly — Client-side

The Next.js client for **Submittly**, a project-submission and review platform built around two personas: students submit their work, mentors review it (admins use the mentor surfaces). This codebase is the server-rendered + client-hydrated frontend that talks to the [Submittly Express API](../Server-side) through a hard, server-side proxy boundary.

> **Spec:** [`../Docs/submittly_project_requirements.md`](../Docs/submittly_project_requirements.md)
> **Implementation plan:** [`docs/implementation-plan.md`](./docs/implementation-plan.md) — the source of truth for architectural decisions (§12 decision log)
> **Coding style:** [`docs/coding-style.md`](./docs/coding-style.md) — binding for every change

---

## Table of contents

- [Feature overview](#feature-overview)
- [Tech stack](#tech-stack)
- [Requirements](#requirements)
- [Setup](#setup)
- [Running alongside the backend](#running-alongside-the-backend)
- [Environment variables](#environment-variables)
- [Demo accounts](#demo-accounts)
- [Scripts](#scripts)
- [Routes](#routes)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Design system](#design-system)
- [Data fetching, state & forms](#data-fetching-state--forms)
- [Error handling & loading states](#error-handling--loading-states)
- [Accessibility](#accessibility)
- [shadcn/ui components](#shadcnui-components)
- [Notes](#notes)

---

## Feature overview

### Authentication — `features/auth`

| Feature                          | Detail                                                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full-screen split login / signup | One column is an auto-advancing **promo slide carousel** (pauses on hover/focus), the other the actual form. Each page owns its shell — no shared `(auth)` layout. The promo panel is hidden below `lg`. |
| Session                          | The API token lives in an **httpOnly cookie** (`submittly_session`) set and cleared by a Next route handler — the token never reaches browser JavaScript.                                                |
| Error feedback                   | Failed sign-in surfaces an inline toast ("Invalid email or password."); form values are preserved. The 401 session teardown deliberately skips `/auth/*` endpoints (decision §12 #20).                   |
| Demo accounts                    | One-click sign-ins for every persona (see [Demo accounts](#demo-accounts)) — the button fills the visible form, runs the normal login flow, and routes to the role home.                                 |
| Sign out                         | `DELETE /api/session` clears the cookies server-side.                                                                                                                                                    |
| 401 teardown                     | Any in-app call that returns 401 clears the session and redirects to `/login?next=…`.                                                                                                                    |
| Route-aware redirect             | Signed-in users who hit `/login` are sent to their role home; `/` resolves to `/login` (signed out) or the role home (signed in).                                                                        |

### Student portal — `features/submissions`

| Feature                                     | Detail                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard (`/student/dashboard`)            | "My submissions" in a **real table** (Project / Status / Submitted), degrading to stacked cards below `md`.                                                                                                                                                                                                                                                                  |
| Search & status filter                      | Run **in the browser** over the full list returned by `/submissions/me` — the server scopes the list by token and returns it entirely, so filtering locally is instant and hits no round-trip (decision §12 #21). Search matches project name or repository URL; the result count line, a "no match" empty state with _Clear filters_, and an ARIA live region are included. |
| New submission (`/student/submissions/new`) | A centered (`max-w-2xl`) form: project name, repository URL, optional live link, description. Client validation via Zod mirrors the server; character counters; duplicate repo-URL **early warning** (the server enforces the unique `(studentId, repoUrl)` rule; the client never blocks submit on it).                                                                     |
| Statuses                                    | `PENDING` → `APPROVED` / `REJECTED`, surfaced through a consistent color-coded `StatusBadge`.                                                                                                                                                                                                                                                                                |

### Mentor review dashboard — `features/review`

| Feature                              | Detail                                                                                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Review queue (`/mentor/submissions`) | Server-side filtered + paginated submissions table with URL-driven `page`, `limit` and `status` (shareable views, working back button). "Approve"/"Reject" through a review dialog. Below `md` the table becomes stacked cards. |
| Stats (`/mentor/dashboard`)          | Aggregated counts per status.                                                                                                                                                                                                   |
| Admins                               | The `ADMIN` role uses the mentor surfaces (the role is authorized on the same endpoints).                                                                                                                                       |

The two lists are filtered at different layers **on purpose**: the student list is complete in memory (small, token-scoped), while the mentor queue is per-student-agnostic and paginated, so it is always filtered server-side.

---

## Tech stack

| Layer         | Choice                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Framework     | **Next.js 16** (App Router, Turbopack dev, `proxy.ts` middleware — Next 16's renamed `middleware.ts`)                  |
| UI runtime    | **React 19** + **TypeScript 5.9** (strict)                                                                             |
| Styling       | **Tailwind CSS v4** + **tw-animate-css**; class sorting via `prettier-plugin-tailwindcss`                              |
| Components    | **shadcn/ui v4** built on **Radix UI** (`radix-ui` package), `class-variance-authority` for variants                   |
| Server state  | **TanStack Query v5** (`keepPreviousData` for table paging)                                                            |
| Forms         | **react-hook-form** + **@hookform/resolvers** + **Zod v4** (`useForm` + `zodResolver`, shadcn v4 `<Field>` primitives) |
| Theming       | **next-themes** (class-based light/dark)                                                                               |
| Feedback      | **sonner** toasts                                                                                                      |
| Icons / fonts | **lucide-react**; **Raleway** for UI type, **Geist Mono** for mono                                                     |
| Quality gates | ESLint 10 (flat config, `eslint-config-next`), Prettier, `tsc --noEmit`                                                |

## Requirements

- **Node.js ≥ 20.9**
- **npm ≥ 10**
- The Submittly API running locally — see [`../Server-side`](../Server-side)

## Setup

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# then edit .env.local if the API is not on http://localhost:4000

# 3. Run
npm run dev
```

The app is served at <http://localhost:3000>.

### Running alongside the backend

The client talks to the API through a server-side proxy, so **CORS is never exercised** by the browser. Start the API first:

```bash
cd ../Server-side
npm install
npm run prisma:migrate   # once, to create the schema
npm run prisma:seed      # optional: creates the ADMIN and MENTOR accounts
npm run dev              # API on http://localhost:4000
```

Then start this app in a second terminal.

## Environment variables

| Variable  | Required | Visibility  | Purpose                                                   |
| --------- | -------- | ----------- | --------------------------------------------------------- |
| `API_URL` | yes      | server-only | Base URL of the Express API, e.g. `http://localhost:4000` |

`API_URL` is read **only** by the proxy route at `src/app/api/backend/[...path]/route.ts`. It is never exposed to the browser. There are currently **no `NEXT_PUBLIC_` variables** — anything added with that prefix is public by definition and needs a security review.

Copy `.env.example` to `.env.local` for local work. `.env*` files are git-ignored; `.env.example` is committed.

## Demo accounts

One-click demo sign-ins are on `/login` (small "Explore with a demo" section). The credentials are **throwaway and public by design** — they mirror the server's seed data and are defined in `src/features/auth/demo-accounts.ts`. Rotate the seed and this file together.

| Button       | Email                       | Password        | Lands on             |
| ------------ | --------------------------- | --------------- | -------------------- |
| Student demo | `shawonahmed0294@gmail.com` | `Password@#12`  | `/student/dashboard` |
| Mentor demo  | `mentor@submittly.dev`      | `ChangeMe#2026` | `/mentor/dashboard`  |
| Admin demo   | `admin@submittly.dev`       | `ChangeMe#2026` | `/mentor/dashboard`  |

Do **not** put production credentials in this file — it is source-controlled on purpose.

## Scripts

| Script                 | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Dev server with hot reload (Turbopack)           |
| `npm run build`        | Production build                                 |
| `npm run start`        | Serve the production build                       |
| `npm run lint`         | ESLint (flat config, `eslint-config-next`)       |
| `npm run typecheck`    | `next typegen && tsc --noEmit`                   |
| `npm run format`       | Prettier write (includes Tailwind class sorting) |
| `npm run format:check` | Prettier check (CI)                              |

`next lint` was removed in Next.js 16 — linting runs through the ESLint CLI.

### Quality gates

Every change is verified with `lint` + `typecheck` + `build` + `format:check` before being committed.

## Routes

| Route                      | Access            | What it does                                                                    |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------- |
| `/`                        | anyone            | Redirects to `/login` (signed out) or the role home (signed in)                 |
| `/login`, `/signup`        | signed-out users  | Full-screen split auth pages; signed-in users are redirected to their role home |
| `/student/dashboard`       | `STUDENT`         | My submissions — table, search, status filter                                   |
| `/student/submissions/new` | `STUDENT`         | New submission form                                                             |
| `/mentor/dashboard`        | `MENTOR`, `ADMIN` | Review stats                                                                    |
| `/mentor/submissions`      | `MENTOR`, `ADMIN` | Review queue — server-side filter + pagination + approve/reject                 |

Guards are enforced in **two layers**: `src/proxy.ts` gates routes by cookie-based session and role (UX only — as a first line), and the API independently authorizes every request (the real authority).

## Architecture

```
Browser ──/api/backend/*──▶ Route Handler proxy ──Bearer──▶ Express API (:4000)
   │                              │
   │                       reads/writes httpOnly cookies
   ▼
TanStack Query (client state) + Server Components (page shells)
```

- **`src/proxy.ts`** — Next 16's renamed `middleware.ts`. Gates routes by session + role (UX-only; see above).
- **`src/app/api/backend/[...path]/route.ts`** — the only code that talks to the Express API. Attaches the `Authorization: Bearer` header server-side, stores the token in an httpOnly cookie, and passes upstream status codes through (400/401/403/404/409/422/429/500 all survive the hop). Because the hop is same-origin, CORS is never involved.
- **A 401 in the app** — `apiFetch` clears the session cookies server-side (browser JS cannot delete an httpOnly cookie) and redirects to `/login?next=<path>`, except on `/auth/*` where the failure feedback must stay inline (decision §12 #20).
- **`src/features/<feature>/`** — vertical slices: `api.ts`, `keys.ts`, `schemas.ts`, `params.ts`, `types.ts`, `components/`, `hooks/`. Query keys are never inlined (`keys.ts` per feature) so that cache invalidation can't drift.
- **`src/components/shared/`** — app-wide composites only: `dashboard-shell`, `page-header`, `empty-state`, `error-state`, `loading-skeleton`, `status-badge`, `status-filter`, `theme-toggle`. Shared code cannot import from a feature — when two features need the same control it is promoted here, not duplicated.
- **`src/components/ui/`** — shadcn/ui components, generated by the CLI. **Do not edit them by hand.**
- **Server Components everywhere by default** — pages are plain Server Components; only interactive leaves (forms, tables, dialogs, navs, toasts) are `'use client'`. The dashboard shell takes its sidebar nav as a **React element slot** so icons do not cross the server → client boundary.

## Project structure

```
src/
├── app/
│   ├── (auth)/                  # login + signup; no group layout — pages own their split shells
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (student)/
│   │   ├── error.tsx / loading.tsx
│   │   └── student/
│   │       ├── layout.tsx        # auth-guarded dashboard shell + student nav
│   │       ├── dashboard/page.tsx
│   │       └── submissions/new/page.tsx
│   ├── (mentor)/
│   │   ├── error.tsx / loading.tsx
│   │   └── mentor/
│   │       ├── layout.tsx        # dashboard shell + mentor nav
│   │       ├── dashboard/page.tsx
│   │       └── submissions/page.tsx
│   └── api/
│       ├── backend/[...path]/route.ts   # the proxy — only place calling the Express API
│       └── session/route.ts             # login/logout via httpOnly cookies
├── components/
│   ├── shared/                  # app-wide composites (see Architecture)
│   └── ui/                      # shadcn/ui generated sources
├── features/
│   ├── auth/                    # login form, demo accounts, promo slides, session types
│   ├── review/                  # mentor queue: table, explorer, stats, review dialog
│   └── submissions/             # student: my-submissions table, form, hooks, schemas
├── hooks/                       # app-wide hooks (use-mobile etc.)
├── lib/                         # api-client (apiFetch/ApiError/toast mapping), theme vars utils
├── providers/                   # TanStack Query + next-themes providers
├── types/
│   └── api.ts                   # domain types mirroring the server (kept in sync by hand)
└── proxy.ts                     # role/UX route gating
```

## Design system

The brand reads **"red brand, black chrome"** — every UI chrome element (sidebar, header accents) is built from a red scale over black.

### Brand palette

Anchored in `globals.css` as a custom Tailwind `brand-*` scale:

| Token       | Hex       | Usage                                                  |
| ----------- | --------- | ------------------------------------------------------ |
| `brand-300` | `#FF0000` | Primary red — light theme accents, focus rings         |
| `brand-500` | `#BC0202` | Light-theme primary buttons/links                      |
| `brand-700` | `#830000` | Dark-theme primary (buttons/links in dark mode)        |
| `brand-900` | `#000000` | Black chrome — the sidebar is black in **both** themes |

### Typography

- **Raleway** (variable `--font-raleway`) is the sans/heading face for the whole app.
- **Geist Mono** remains the `mono` face (numbers/labels where fixed-width matters).

### Theming

- Light/dark toggle (`next-themes`, class strategy) — lives in the dashboard top bar and in the auth form column.
- Dark mode intentionally dials the primary down to `brand-700` (`#830000`) instead of the pure red.
- Sidebar: `w-` shadcn v4 sidebar; active items use `data-active:bg-sidebar-primary` overrides because v4's default active state is accent grey, which fights the red brand.

## Data fetching, state & forms

- **All server data flows through TanStack Query.** `apiGet`/`apiPost`/`apiPatch` wrap the proxy hop and normalize failures into a typed `ApiError` (with the server's `code` + `details[]`), which maps onto form fields by `path`.
- **Tables**: `keepPreviousData` keeps the current rows on screen while the next page/filter loads — no flashing empty states.
- **URL is state for server-driven lists**: the mentor queue keeps `page` / `limit` / `status` in the query string; every value is defensively parsed (it is user input) before reaching the API, and changing a filter resets the page.
- **Forms**: `useForm` + `zodResolver` with schemas duplicated from the server's contract (client validation is for usability only — the server re-validates everything). The submit form also does an in-memory duplicate-repo-URL check against the already-loaded list.
- **Optimistic duplication is avoided**: after a successful submit, the dashboard's list query is invalidated by key, not manipulated by hand.

## Error handling & loading states

- Per-route-group **error boundaries** (`(auth)`, `(student)`, `(mentor)` `error.tsx`) with a reset affordance.
- **`ErrorState`** for failed data fetches: message + retry that calls `refetch()`; shows the API's own message when available.
- **`EmptyState`** composites: "no submissions yet" with a CTA, and the filtered-out "no submissions match" variant with _Clear filters_.
- **`LoadingSkeleton`** / shadcn `Skeleton` placeholders that match the shape of the real content (tables skeleton as rows, stats as cards).
- **Toasts** (sonner) for auth feedback and submission success; destructive outcomes prefer inline field errors over toasts.

## Accessibility

- Icons-only buttons carry `aria-label`s; decorative icons are `aria-hidden`.
- Links that open in a new tab announce it via `sr-only` text.
- Live regions: the table's result count is `aria-live="polite"`; form errors are tied to inputs with `aria-invalid` + `<FieldError>`.
- Status is conveyed by badge **text**, never color alone.
- The promo carousel pauses on hover/focus; dialogs trap focus (Radix).

## shadcn/ui components

```bash
npx shadcn@latest add <component>
```

The CLI writes real source into `src/components/ui/`. Customise by wrapping in `components/shared/`, adding a `cva` variant — never by editing the generated file.

> shadcn/ui v4 replaced the old `Form` component with `<Field>` primitives (`Field`, `FieldLabel`, `FieldError`, `FieldDescription`, `FieldGroup`). `Sidebar`/`Tooltip`/`Sheet`/`Table`/`Dialog` etc. all come from the CLI.

## Notes

- `package.json` pins `effect` via `overrides`. `@hookform/resolvers@6` declares an optional `effect@^4` peer that conflicts with the `@typeschema` chain's `effect@^3`. The zod resolver does not use `effect` at all; the pin satisfies the packages that are actually installed.
- `next.config.ts` leaves `cacheComponents` off. The app reads cookies for the session and leans on TanStack Query for interactivity, so the default dynamic rendering model is the predictable fit.
- `next typegen` runs inside `npm run typecheck` — route types are generated before `tsc` checks them.
- `npm audit` reports a high-severity advisory in `braces`, reachable only through `eslint-config-next` → `fast-glob`. It is dev-only, and the upstream fix downgrades `eslint-config-next` to v14, which breaks the Next 16 setup. It is not auto-fixed for that reason.
- Frontend env (`API_URL`) is deliberately the **only** server-side secret on the client; anything else belongs to the server.
