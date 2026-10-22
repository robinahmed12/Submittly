# Submittly — Frontend Implementation Plan

> **Spec:** [`../../Docs/submittly_project_requirements.md`](../../Docs/submittly_project_requirements.md) — referred to below as **Requirements §x**.
> **Companion doc:** [`coding-style.md`](./coding-style.md) — binding conventions for every PR.
> **Backend contract:** [`../../Server-side/docs/implementation-plan.md`](../../Server-side/docs/implementation-plan.md) — the Express 5 + Prisma 7 API this app consumes.
> **Scope:** `Client-side/` source code. Backend conventions live in [`../../Server-side/docs/coding-style.md`](../../Server-side/docs/coding-style.md).

---

## 1. Overview

Submittly's frontend is a **Next.js 16 App Router** application that consumes the Submittly Express API. One deployment serves two personas:

- **Student Portal** — submit a project, track its review status.
- **Mentor Review Dashboard** — paginated submissions, server-side status filters, approve/reject actions, aggregate statistics.

The backend is already implemented and frozen (`Server-side/docs/implementation-plan.md` Outlets 1–5 are complete). This plan therefore specifies **how the client consumes a known contract** — not how to build the API.

### 1.1 Design principles

| Principle                                       | Consequence in this codebase                                                                                                                               |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The server is the only authority on permissions | Route gating in the client is **UX**. Every call is independently authorized by `authenticate` + `authorize`. Hiding a button is never a security control. |
| The token never reaches browser JavaScript      | httpOnly cookies + a server-side proxy route (§4).                                                                                                         |
| The browser only ever talks to the Next origin  | CORS is never exercised by the app; `CORS_ORIGIN` on the backend is only needed for direct tools (Postman, curl).                                          |
| Server state lives in TanStack Query            | No `useEffect` fetching. Explicit loading / empty / error states everywhere.                                                                               |
| Server Components by default                    | `'use client'` only on genuinely interactive islands.                                                                                                      |
| Client validation is UX, never security         | Zod schemas mirror the server's rules; the server re-validates every input.                                                                                |
| Pagination and filtering are server-driven      | `page`, `limit`, `status` are query-string state, so URLs are shareable and the back button works.                                                         |

### 1.2 Status

| Item              | State                                            |
| ----------------- | ------------------------------------------------ |
| Requirements      | ✅ `Docs/submittly_project_requirements.md`      |
| Backend API       | ✅ implemented; contract verified against source |
| Frontend scaffold | ⬜ not started — `Client-side/` is empty         |
| This document     | ✅ written                                       |

---

## 2. Tech Stack & Dependencies

| Layer        | Choice                                                                             | Notes                                                                      |
| ------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Framework    | **Next.js 16.4.2** (App Router)                                                    | `proxy.ts` replaces `middleware.ts` in v16 (§4.3)                          |
| UI runtime   | **React 19.3.1**                                                                   | Server Components by default                                               |
| Language     | **TypeScript 5.9.3**                                                               | `strict: true` + the extra flags from §2.3                                 |
| Styling      | **Tailwind CSS 4.3.3**                                                             | CSS-first config — **no `tailwind.config.js`**                             |
| Components   | **shadcn/ui** (CLI 4.22.1)                                                         | Copied into `src/components/ui` — _not_ an npm dependency                  |
| Primitives   | **`radix-ui` 1.8.1**                                                               | The unified Radix package shadcn v4 uses — not individual `@radix-ui/*`    |
| Forms        | **react-hook-form 7.90.0** + `@hookform/resolvers` 6.0.0                           | `zodResolver`; paired with shadcn's `<Field>` primitives (§2.6)            |
| Validation   | **Zod 4.6.7**                                                                      | Deliberately the **same version** as the server                            |
| Server state | **TanStack Query 5.104.5**                                                         | Cache, invalidation, explicit states                                       |
| Icons        | **lucide-react 1.61.0**                                                            | shadcn `iconLibrary: "lucide"`                                             |
| Toasts       | **sonner 2.0.8**                                                                   | Backs shadcn's `toast` component                                           |
| Theme        | **next-themes 0.4.6**                                                              | Dark mode via the `class` strategy                                         |
| Utilities    | `class-variance-authority` 0.7.1, `clsx` 2.1.1, `tailwind-merge` 3.7.0, `cn` 0.5.0 | `cn()` in `src/lib/utils.ts`                                               |
| Lint         | `eslint` 10.13.0 + `eslint-config-next` 16.4.2                                     | Flat config; bundles `typescript-eslint` 8.72.0, `jsx-a11y`, `react-hooks` |
| Format       | `prettier` 3.9.10 + `prettier-plugin-tailwindcss` 0.8.1                            |                                                                            |

### 2.1 Install

```bash
# 1. Scaffold (run inside Client-side/)
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2. Runtime dependencies
npm i @tanstack/react-query@^5 react-hook-form@^7 @hookform/resolvers@^6 zod@^4 \
      lucide-react class-variance-authority clsx tailwind-merge sonner next-themes

# 3. Dev dependencies
npm i -D prettier prettier-plugin-tailwindcss

# 4. shadcn/ui
npx shadcn@latest init --base radix --preset nova
npx shadcn@latest add button card input label textarea field input-group table badge \
  select dialog alert skeleton dropdown-menu separator pagination avatar tabs
```

`shadcn add` writes real source into `src/components/ui/` — **never edit those files by hand** (see `coding-style.md` §8).

> **`@hookform/resolvers@6` peer conflict.** It declares an optional `effect@^4` peer that the `@typeschema` chain contradicts with `effect@^3`. The zod resolver does not use `effect` at all, so `package.json` pins the transitive package instead:
>
> ```json
> "overrides": { "effect": "^3.6.8" }
> ```
>
> Without the pin, `npm install` fails with `ERESOLVE`. Do not remove it, and do not "fix" it with `--legacy-peer-deps` — that disables peer checking for the whole project.

### 2.2 `package.json` scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "next typegen && tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

`next typegen` runs first because the global `PageProps` / `LayoutProps` / `RouteContext` type helpers (§4.2) are generated into `.next/types/`, which is git-ignored. Without it, `tsc --noEmit` fails on a fresh clone.

> `next lint` was **removed** in Next.js 16 — linting runs through the ESLint CLI directly.

### 2.3 `tsconfig.json` essentials

`create-next-app` generates a working baseline. Two changes are required — the `@/*` alias must point at `./src/*`, and the strictness flags are raised to match the server's rigour:

```jsonc
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    // Parity with Server-side/tsconfig.json
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] },
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts",
  ],
  "exclude": ["node_modules"],
}
```

> **`exactOptionalPropertyTypes` friction.** It is the one flag that fights React props. A component declaring `subtitle?: string` cannot be handed `subtitle={undefined}` — declare `subtitle?: string | undefined` in that case. Fix the prop type; do **not** disable the flag.

### 2.4 `components.json`

Written by `shadcn init`. The v4 CLI names styles `<base>-<preset>`; this project uses the Radix base with the Nova preset.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

`style`, `baseColor`, and `cssVariables` **cannot be changed after `init`** without reinstalling the components.

### 2.5 Tailwind v4 theme (`src/app/globals.css`)

Tailwind v4 is configured in CSS. There is no `tailwind.config.js`; `components.json` therefore sets `"tailwind.config": ""`.

`shadcn init` writes the file with the full token set — `:root` and `.dark` blocks, an `@theme inline` block mapping the tokens onto Tailwind's colour utilities, and an `@layer base` block applying the defaults. **Extend it with new tokens rather than hard-coding values in components.**

The generated OKLCH palette has been replaced with the Submittly brand palette (`#FF0000`, `#BC0202`, `#830000`, `#000000`). The four colours are anchored into a Tailwind scale — `brand-300` = `#FF0000`, `brand-500` = `#BC0202`, `brand-700` = `#830000`, `brand-900` = `#000000`, with derived tints/shades between — exposed as utilities such as `bg-brand-500`:

```css
@theme inline {
  --color-brand-500: #bc0202; /* the four brand colours plus derived steps */
  /* …every semantic token maps onto the scale… */
}

:root {
  --primary: #bc0202; /* buttons, active nav, focus ring */
  --destructive: #ff0000; /* destructive actions */
  --sidebar: #000000; /* the sidebar is black in both themes */
  --sidebar-primary: #bc0202; /* active nav item */
}

.dark {
  --primary: #830000; /* the deep red reads better on dark */
  --ring: #ff0000;
}
```

Fonts come from `next/font/google`: **Raleway** (`--font-raleway`) for sans/heading, **Geist Mono** (`--font-geist-mono`) for mono. The font tokens in `@theme inline` point at those variables:

```css
--font-sans: var(--font-raleway);
--font-heading: var(--font-raleway);
--font-mono: var(--font-geist-mono);
```

### 2.6 Form primitives — `<Field>`, not `<Form>`

**shadcn/ui v4 removed the old `Form` component.** Forms are now built from the `<Field>` family plus react-hook-form's `<Controller>`:

| Import from `@/components/ui/field` | Purpose                          |
| ----------------------------------- | -------------------------------- |
| `Field`                             | The wrapper for one control      |
| `FieldLabel`                        | The `<label>`                    |
| `FieldDescription`                  | Helper text                      |
| `FieldError`                        | Validation message               |
| `FieldGroup`                        | Vertical rhythm between fields   |
| `FieldContent`                      | Label + description side by side |
| `FieldSet` / `FieldLegend`          | Grouping for related fields      |
| `FieldTitle` / `FieldSeparator`     | Titles and dividers              |

`@/components/ui/input-group` adds `InputGroup`, `InputGroupAddon`, and `InputGroupText` — used for the character counter under the description field.

The pattern is: `useForm` + `zodResolver` for state and validation, `<Controller>` for each control, `<Field data-invalid={fieldState.invalid}>` for the wrapper, and `aria-invalid` on the control itself.

---

## 3. Architecture — App Router + Feature Slices

### 3.1 Request flow

```mermaid
flowchart TD
    B[Browser] -->|fetch /api/backend/*| P[Next.js Route Handler<br/>src/app/api/backend/[...path]/route.ts]
    P -->|adds Authorization: Bearer| E[Express API<br/>:4000/api/*]
    E -->|envelope| P
    P -->|verbatim envelope<br/>+ sets httpOnly cookies| B
    B -->|useQuery / useMutation| Q[TanStack Query]
    Q -->|apiFetch| B

    R[Next.js request] --> X[src/proxy.ts<br/>role gate]
    X -->|redirect| B
```

Two separate paths, deliberately:

- **`/api/backend/*`** — the data path. Server-side proxy, Bearer header attached server-side, cookies written here.
- **`src/proxy.ts`** — the navigation path. Reads the session cookie, redirects by role. **Never** relied on for security.

### 3.2 Directory structure

```
Client-side/
├── docs/
│   ├── implementation-plan.md
│   └── coding-style.md
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx                       # root: fonts, providers, Toaster
│   │   ├── globals.css                      # Tailwind v4 + theme tokens
│   │   ├── page.tsx                         # redirect: /login, or the role home
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx               # both: full-screen split (promo + form; no group layout)
│   │   ├── (student)/
│   │   │   └── student/
│   │   │       ├── layout.tsx               # student shell + nav
│   │   │       ├── dashboard/page.tsx       # my submissions + status
│   │   │       └── submissions/new/page.tsx # submission form
│   │   ├── (mentor)/
│   │   │   └── mentor/
│   │   │       ├── layout.tsx               # mentor shell + nav
│   │   │       ├── dashboard/page.tsx       # stats cards
│   │   │       └── submissions/page.tsx     # paginated table + filters
│   │   └── api/
│   │       ├── backend/[...path]/route.ts   # THE proxy (§4.2)
│   │       └── session/route.ts             # DELETE → logout (clears cookies)
│   ├── components/
│   │   ├── ui/                              # shadcn — generated, do not edit
│   │   ├── shared/                          # app-wide composites
│   │   │   ├── dashboard-shell.tsx          # SaaS shell: sidebar + top bar (nav is a slot)
│   │   │   ├── empty-state.tsx
│   │   │   ├── error-fallback.tsx
│   │   │   ├── error-state.tsx
│   │   │   ├── loading-skeleton.tsx
│   │   │   ├── page-header.tsx
│   │   │   └── status-badge.tsx
│   │   └── features/                        # feature-scoped composites
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api.ts                       # login / signup / logout calls
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx            # incl. one-click demo-account sign-ins (§12 #19)
│   │   │   │   ├── signup-form.tsx
│   │   │   │   ├── promo-slides.tsx          # the full-screen promo carousel (§12 #18)
│   │   │   │   └── user-menu.tsx
│   │   │   ├── demo-accounts.ts              # demo credentials; only imported by client code
│   │   │   ├── hooks/
│   │   │   │   ├── use-login.ts
│   │   │   │   ├── use-logout.ts
│   │   │   │   └── use-signup.ts
│   │   │   ├── form-error.ts                # maps an API failure onto form fields
│   │   │   ├── keys.ts                      # query-key factory
│   │   │   ├── roles.ts                     # roleHome / roleLabel / safeNextPath
│   │   │   ├── schemas.ts                   # Zod (mirrors server rules)
│   │   │   └── types.ts
│   │   ├── submissions/
│   │   │   ├── api.ts
│   │   │   ├── components/
│   │   │   │   ├── submission-form.tsx
│   │   │   │   ├── my-submissions-table.tsx  # the student's table (cards below md)
│   │   │   │   └── student-nav.tsx           # client: sidebar menu + icons + active state
│   │   │   ├── hooks/
│   │   │   │   ├── use-create-submission.ts
│   │   │   │   └── use-my-submissions.ts
│   │   │   ├── keys.ts
│   │   │   ├── schemas.ts
│   │   │   └── types.ts
│   │   └── review/
│   │       ├── api.ts
│   │       ├── components/
│   │       ├── components/
│   │       │   ├── mentor-nav.tsx            # client: sidebar menu + icons + active state
│   │       │   ├── review-dialog.tsx
│   │       │   ├── stats-cards.tsx
│   │       │   ├── stats-overview.tsx
│   │       │   ├── submissions-explorer.tsx  # URL-driven list: status filter, page size, pagination
│   │       │   ├── submissions-table.tsx
│   │       │   └── table-pagination.tsx
│   │       ├── hooks/
│   │       │   ├── use-stats.ts
│   │       │   ├── use-submissions.ts
│   │       │   └── use-update-status.ts
│   │       ├── keys.ts
│   │       ├── schemas.ts
│   │       └── types.ts
│   ├── lib/
│   │   ├── api-client.ts                    # fetch wrapper + ApiError (§5.2)
│   │   ├── query-client.ts                  # QueryClient factory + defaults
│   │   ├── session.ts                       # cookie names, Session type, parsing (framework-free)
│   │   ├── session-server.ts                # server-only: getSession() / clearSession()
│   │   └── utils.ts                         # cn()
│   ├── hooks/
│   │   └── use-mobile.ts                    # useSyncExternalStore (§5.6)
│   ├── providers/
│   │   ├── query-provider.tsx
│   │   └── theme-provider.tsx
│   ├── types/
│   │   └── api.ts                           # envelopes + domain types (§5.1)
│   └── proxy.ts                             # Next 16 role gate (§4.3)
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── postcss.config.mjs
├── .env.example
├── .prettierrc
└── package.json
```

Route groups (`(auth)`, `(student)`, `(mentor)`) organise files **without** affecting the URL. They exist so each persona gets its own `layout.tsx` shell.

### 3.3 Dependency direction

```
features/* → { lib/*, components/shared/*, types/* }     allowed
features/A → features/B                                   forbidden
components/shared → features/*                            forbidden — except features/auth
components/ui → features/*                                forbidden
app/(student) → features/mentor                           forbidden
app/(mentor)  → features/student                          forbidden
```

The persona boundary is as hard as the feature boundary: the mentor shell must never import a student component.

**The one exception: `components/shared → features/auth`.** The auth feature is cross-cutting — every persona has an account, and the app shell shows the signed-in user — so the shared app shell may use `features/auth`. Persona features (`submissions`, `review`) remain off-limits to shared code. If a shared component ever needs a persona-specific piece, that is a sign the component belongs in a persona folder instead.

---

## 4. Auth Architecture

### 4.1 Cookies

Two httpOnly cookies. `httpOnly` means browser JavaScript cannot read them — which is the entire point.

| Cookie              | Value                            | Read by                           | Purpose                                                           |
| ------------------- | -------------------------------- | --------------------------------- | ----------------------------------------------------------------- |
| `submittly_token`   | The JWT                          | **Proxy route only**              | Attached as `Authorization: Bearer <token>` to every backend call |
| `submittly_session` | JSON `{ id, name, email, role }` | `src/proxy.ts`, server components | Role-based navigation and rendering the signed-in user            |

Attributes for both: `httpOnly: true`, `sameSite: 'lax'`, `path: '/'`, `secure: true` in production, `maxAge` matching the backend's `JWT_EXPIRES_IN` (7 days by default).

`submittly_session` holds **no secret** — it is the same user object the API already returns. It exists so `src/proxy.ts` can gate routes without re-verifying a JWT signature.

### 4.2 The proxy route

`src/app/api/backend/[...path]/route.ts` is the **only** place that talks to the Express API. Everything the browser sends is prefixed `/api/backend/`.

A Route Handler must export HTTP methods, so the shared logic lives in one function that each verb re-exports. (`proxy` is reserved for `src/proxy.ts` — §4.3 — and must not be used here.)

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TOKEN_COOKIE = 'submittly_token';
const SESSION_COOKIE = 'submittly_session';
const API_URL = process.env.API_URL; // server-only — never NEXT_PUBLIC_

export const dynamic = 'force-dynamic';

type BackendRoute = RouteContext<'/api/backend/[...path]'>;

async function handler(request: NextRequest, { params }: BackendRoute): Promise<Response> {
  const { path } = await params; // params is a Promise in Next 16
  const incoming = new URL(request.url);
  const target = new URL(`/api/${path.join('/')}`, API_URL);
  target.search = incoming.search;

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  const headers = new Headers({ accept: 'application/json' });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  if (token) headers.set('authorization', `Bearer ${token}`);

  const method = request.method;
  // `null`, not `undefined`: with `exactOptionalPropertyTypes` an explicit
  // `undefined` is not assignable to `BodyInit | null`.
  const body = method === 'GET' || method === 'HEAD' ? null : await request.text();

  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body, cache: 'no-store' });
  } catch {
    // The backend is unreachable — synthesise the same envelope shape so the
    // client's error handling has exactly one code path.
    return NextResponse.json(
      { success: false, message: 'The API is unreachable. Please try again.', code: 'INTERNAL' },
      { status: 502 },
    );
  }

  const payload = await upstream.text();
  let body = payload;

  // Auth responses carry a token: persist it as an httpOnly cookie, store the
  // non-sensitive user object alongside it, and strip the token from the body
  // so it never reaches browser JavaScript.
  const parsed = upstream.ok ? safeJson(payload) : null;
  const issuedToken = parsed?.data?.token;
  const issuedUser = parsed?.data?.user;

  if (typeof issuedToken === 'string' && issuedUser) {
    delete parsed.data.token;
    body = JSON.stringify(parsed);
  }

  const response = new NextResponse(body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });

  if (typeof issuedToken === 'string' && issuedUser) {
    setSessionCookies(response, issuedToken, issuedUser);
  }

  return response;
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
```

> **`RouteContext<'/api/backend/[...path]'>`** is a global type helper generated by `next typegen` into `.next/types/`. It types `params` for the route, so there is no hand-written `RouteContext` type. Run `npm run typecheck` (which runs `next typegen` first) after adding a new dynamic route.

**Proxy contract (binding):**

| Rule                                                     | Detail                                                                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| The upstream body is passed through **verbatim**         | The client never re-shapes an envelope. Success and error envelopes reach the browser exactly as the API produced them. |
| The upstream **status code** is passed through           | 400/401/403/404/409/422/429/500 all survive the hop.                                                                    |
| `Authorization` is added only when a token cookie exists | Anonymous calls (`/auth/login`, `/auth/signup`, `/health`) need no header.                                              |
| The request `content-type` is forwarded                  | The API parses JSON bodies.                                                                                             |
| `GET`/`HEAD` send no body                                | Forwarding an empty body breaks some runtimes.                                                                          |
| The token is **stripped** from successful auth responses | It lives in the cookie, never in JS.                                                                                    |
| Network failure → `502` with a synthesised envelope      | One error shape for the client to handle.                                                                               |

### 4.3 Route gating — `src/proxy.ts`

Next.js 16 renamed `middleware.ts` to **`proxy.ts`** and the exported function from `middleware` to `proxy`. It runs on the **Node.js runtime** by default in v16, so it can read cookies and use Node APIs.

```ts
// src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'submittly_session';

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value);

  const allowed = allowedRoles(pathname);

  if (allowed) {
    if (!session) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url),
      );
    }
    if (!allowed.includes(session.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if ((pathname === '/login' || pathname === '/signup') && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except API routes and static assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
```

| Path prefix         | Allowed roles                               |
| ------------------- | ------------------------------------------- |
| `/student/**`       | `STUDENT`                                   |
| `/mentor/**`        | `MENTOR`, `ADMIN`                           |
| `/login`, `/signup` | public (redirect away if already signed in) |
| `/`                 | public (redirects by role)                  |

> **This is UX, not security.** Next.js's own guidance is to verify authorization inside the handler rather than relying on the proxy alone. Here the **backend** is the real enforcement point — `authorize('MENTOR')` returns `403 ROLE_FORBIDDEN` regardless of what the client does. The proxy only avoids showing a user a page that will fail.

### 4.4 Session lifecycle

| Event        | Flow                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Signup       | `POST /api/backend/auth/signup` → proxy writes both cookies → `router.push('/student/dashboard')`                                          |
| Login        | `POST /api/backend/auth/login` → proxy writes both cookies → `router.push(roleHome(role))`                                                 |
| Logout       | `DELETE /api/session` → clears both cookies → `router.push('/login')`                                                                      |
| Token expiry | Any call returns `401 AUTH_REQUIRED` → `apiFetch` calls `DELETE /api/session` to clear the cookies server-side, then redirects to `/login` |
| Role change  | The backend does not expose role changes; the session cookie is refreshed on the next login                                                |

`roleHome(role)` lives in `src/features/auth/`: `STUDENT → '/student/dashboard'`, `MENTOR`/`ADMIN → '/mentor/dashboard'`.

---

## 5. Shared Infrastructure

### 5.1 `src/types/api.ts`

The domain types are **mirrors** of the backend's Prisma-derived views. Dates are `string` on the client (JSON serialises `Date` → ISO string).

```ts
export type Role = 'STUDENT' | 'MENTOR' | 'ADMIN';
export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'ROLE_FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_SUBMISSION'
  | 'EMAIL_ALREADY_EXISTS'
  | 'INVALID_STATUS_TRANSITION'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  code?: ApiErrorCode;
  details?: ApiErrorDetail[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

/**
 * The auth response the browser receives.
 *
 * The API returns `{ user, token }`, but the backend proxy strips the token
 * and delivers it as the `submittly_token` httpOnly cookie — so the browser
 * only ever sees the user.
 */
export interface AuthPayload {
  user: AuthUser;
}

export interface Submission {
  id: string;
  studentId: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string | null;
  description: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionList {
  items: Submission[];
  total: number;
}

export interface ReviewStudent {
  id: string;
  name: string;
  email: string;
}

export interface ReviewSubmission {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string | null;
  description: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
  student: ReviewStudent;
}

export interface PaginatedSubmissions {
  items: ReviewSubmission[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
```

The `ApiErrorCode` union is identical to the server's `lib/errors.ts`. Keep them in sync — a new server code means a new client code.

### 5.2 `src/lib/api-client.ts`

One function, one error type. Every feature calls through it.

```ts
import type { ApiErrorCode, ApiErrorDetail, ApiFailure, ApiResponse } from '@/types/api';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: ApiErrorCode,
    readonly details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...init?.headers,
    },
    credentials: 'same-origin',
  });

  // A 401 means the token expired or was rejected. Tear the session down
  // before throwing, so the caller never has to think about it.
  if (response.status === 401) {
    await endSession();
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    const failure = payload as ApiFailure;
    throw new ApiError(response.status, failure.message, failure.code, failure.details);
  }

  return payload.data;
}
```

Thin wrappers for the three verbs the app uses — `apiGet(path)`, `apiPost(path, body)`, `apiPatch(path, body)` — so callers never hand-roll `JSON.stringify`.

**Error → message mapping.** The API's `message` is already human-readable and domain-specific ("You have already submitted a project with this repository URL."), so it is shown **verbatim**. The mapping below only adds a fallback for codes that arrive without a message:

| Code                             | Fallback message                                                 |
| -------------------------------- | ---------------------------------------------------------------- |
| `AUTH_REQUIRED` / `AUTH_INVALID` | "Your session has expired. Please sign in again."                |
| `ROLE_FORBIDDEN`                 | "You do not have permission to perform this action."             |
| `VALIDATION_ERROR`               | "Please check the highlighted fields and try again."             |
| `DUPLICATE_SUBMISSION`           | "You have already submitted a project with this repository URL." |
| `EMAIL_ALREADY_EXISTS`           | "An account with this email already exists."                     |
| `INVALID_STATUS_TRANSITION`      | "This submission has already been reviewed."                     |
| `RATE_LIMITED`                   | "Too many attempts. Please wait a moment and try again."         |
| `NOT_FOUND`                      | "We couldn't find what you were looking for."                    |
| `INTERNAL`                       | "Something went wrong on our end. Please try again."             |

`401` is special-cased in `apiFetch`: it calls `DELETE /api/session` — the local route handler, which clears the cookies **server-side**, because browser JavaScript cannot delete an httpOnly cookie — and then redirects to `/login?next=<path>` before throwing.

The redirect is a **hard navigation**, not a router push: the session is gone and the TanStack Query cache still holds the previous user's data, so a client-side transition would keep that cache. The destination is built with `new URL(..., window.location.origin)` so the intent is explicit and the `@next/next/no-location-assign-relative-destination` rule stays satisfied.

### 5.3 `src/providers/query-provider.tsx`

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/api-client';

// A fresh client per server render keeps requests isolated; a single browser
// client preserves the cache across re-renders.
let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') return new QueryClient();
  browserQueryClient ??= new QueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={
        getQueryClient() ??
        new QueryClient({
          defaultOptions: {
            queries: {
              staleTime: 30_000,
              refetchOnWindowFocus: false,
              retry: (failureCount, error) => {
                // Never retry a client error — the request will fail identically.
                if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                  return false;
                }
                return failureCount < 2;
              },
            },
          },
        })
      }
    >
      {children}
    </QueryClientProvider>
  );
}
```

> The provider follows the pattern in Next.js's own
> [TanStack Query guide](https://nextjs.org/docs/app/guides/client-side-data-fetching/tanstack-query).
> Move the `defaultOptions` into `getQueryClient()` so the browser client gets
> them too — the snippet above keeps them in one place for illustration.

### 5.4 Session helpers

Split across two files, because `src/proxy.ts` needs the cookie names and the parser but must **not** pull `next/headers` into the proxy bundle.

**`src/lib/session.ts`** — framework-free. Importable from the proxy, the route handlers, and client code.

```ts
import type { Role, Session } from '@/types/api';

export const TOKEN_COOKIE = 'submittly_token';
export const SESSION_COOKIE = 'submittly_session';

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7, // matches the backend's JWT_EXPIRES_IN default
} as const;

export function parseSession(raw: string | undefined): Session | null;
export function serializeSession(session: Session): string;
```

`parseSession` returns `null` for a missing, malformed, or unrecognised cookie rather than throwing — a corrupt cookie should log the user out, not crash the request.

**`src/lib/session-server.ts`** — `import 'server-only'`, so it can never reach a client bundle.

```ts
import 'server-only';
import { cookies } from 'next/headers';

export async function getSession(): Promise<Session | null>;
export async function clearSession(): Promise<void>;
```

`cookies()` is async in Next.js 16 — always `await` it.

### 5.5 `src/components/shared/`

App-wide composites only. Feature-specific components live in `features/*/components/`.

| Component              | Purpose                                                                                                                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dashboard-shell.tsx`  | SaaS shell: black sidebar + top bar + page container. The sidebar nav is a _slot_ (`sidebar: ReactNode`) because icon components cannot cross the server → client boundary (§12 #15). Imports `features/auth` — the one allowed exception |
| `theme-toggle.tsx`     | Light/dark switch, in the top bar and on the signed-out pages                                                                                                                                                                             |
| `page-header.tsx`      | Title + description + action slot                                                                                                                                                                                                         |
| `loading-skeleton.tsx` | Placeholder blocks that match the shape of the real content                                                                                                                                                                               |
| `empty-state.tsx`      | Icon + title + description + optional action                                                                                                                                                                                              |
| `error-state.tsx`      | Message + retry button                                                                                                                                                                                                                    |
| `status-badge.tsx`     | `PENDING` / `APPROVED` / `REJECTED` → colour + label                                                                                                                                                                                      |
| `status-filter.tsx`    | The status `<Select>` (+ `STATUS_FILTER_OPTIONS`), shared by both submission lists after the student table needed the same control (§12 #21)                                                                                              |

### 5.6 `src/hooks/use-mobile.ts`

shadcn's stock `useIsMobile` calls `setState` inside the effect body, which `react-hooks/set-state-in-effect` forbids. Our version uses `useSyncExternalStore` instead: the media query is external state, the client snapshot is `window.innerWidth < 768`, the server snapshot is `false`, and there is no effect at all. The return type is therefore `boolean` (never `undefined`).

---

## 6. Feature Specs

### 6.1 Feature: `auth`

**Routes:** `/signup`, `/login`, plus `DELETE /api/session` for logout.

**Component tree**

```
app/(auth)/login/page.tsx          Server Component — page shell only
└── features/auth/components/login-form.tsx      'use client'
    ├── shadcn Field / Input / Button (see §2.6)
    └── features/auth/components/user-menu.tsx   (in the app shell, not the form)
```

**`auth/schemas.ts`** — mirrors the server's `auth.schema.ts` exactly:

```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Please provide a valid email address')),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().pipe(z.email('Please provide a valid email address')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
export type SignupInput = z.infer<typeof signupSchema>;
```

> These constraints are **copies** of the server's. When the server changes a rule, change it here in the same PR — see Open Decisions Log #8.

**`auth/roles.ts`** — role → route mapping, plus the open-redirect guard.

```ts
export function roleHome(role: Role): string;
export function roleLabel(role: Role): string;

/**
 * Validates a `?next=` redirect target.
 * Only same-origin, absolute paths are allowed. `//evil.com` and
 * `https://evil.com` are rejected.
 */
export function safeNextPath(next: string | undefined): string | null;
```

`/login?next=…` is validated **server-side** in the page, so the client only ever receives a path that is already known to be same-origin. The hostile value is never rendered into a link.

**`auth/hooks/use-login.ts`**

```ts
export function useLogin(nextPath?: string | null) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: ({ user }) => {
      queryClient.clear(); // a new identity invalidates every cached query
      router.push(nextPath ?? roleHome(user.role));
      router.refresh();
    },
  });
}
```

`use-signup.ts` is identical except it posts to `/auth/signup` and always routes to `/student/dashboard`. `use-logout.ts` calls `DELETE /api/session`, clears the query cache, and routes to `/login`.

**`auth/form-error.ts`** — one helper that maps a failed request onto the form:

```ts
export function applyAuthError<T extends FieldValues>(
  error: unknown,
  form: UseFormReturn<T>,
  fieldFor?: Partial<Record<ApiErrorCode, Path<T>>>,
): void;
```

- `details[]` from the API map onto fields by `path`.
- A code listed in `fieldFor` (e.g. `EMAIL_ALREADY_EXISTS → 'email'`) maps onto that field.
- Everything else becomes a toast.

**Behaviour**

| Case                      | Result                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Invalid credentials       | 401 → toast "Invalid email or password." Form values preserved.                     |
| Duplicate email on signup | 409 `EMAIL_ALREADY_EXISTS` → error on the email field.                              |
| Validation error          | 400 with `details[]` → mapped onto the matching form fields by `path`.              |
| Rate limited              | 429 `RATE_LIMITED` → toast "Too many attempts. Please wait a moment and try again." |
| Success                   | Cookies written by the proxy → redirect to the role home.                           |

> **`form.watch()` is banned.** The React Compiler cannot memoise it safely (`react-hooks/incompatible-library`). Use `useWatch({ control, name })` for a live field value.

### 6.2 Feature: `submissions` (Student Portal)

**Routes:** `/student/dashboard`, `/student/submissions/new`.

**`submissions/schemas.ts`** — mirrors the server's `submission.schema.ts`:

```ts
const httpUrlSchema = z
  .url('Please provide a valid URL')
  .refine(url => /^https?:\/\//i.test(url), 'URL must start with http:// or https://');

/**
 * An optional URL field.
 *
 * The server's schema is `z.string().trim().pipe(httpUrlSchema).optional()`,
 * which treats an **omitted** key as absent but an empty string as an
 * invalid URL. A blank input must therefore become `undefined` before it is
 * sent — `JSON.stringify` then drops the key entirely.
 *
 * The order matters: `.optional()` has to come **before** the transform, or
 * `z.string()` rejects `undefined` before the transform ever runs and the
 * field reports a bogus "expected string" error.
 */
const optionalHttpUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value): string | undefined => (value === '' ? undefined : value))
  .pipe(httpUrlSchema.optional());

export const createSubmissionSchema = z.object({
  projectName: z.string().trim().min(3, '...').max(120, '...'),
  repoUrl: z.string().trim().pipe(httpUrlSchema),
  liveUrl: optionalHttpUrlSchema,
  description: z.string().trim().min(10, '...').max(4000, '...'),
});

/** The form's field values — what the inputs hold. `liveUrl` is a string. */
export type CreateSubmissionFormValues = z.input<typeof createSubmissionSchema>;

/** The validated payload sent to the API — a blank `liveUrl` is `undefined`. */
export type CreateSubmissionInput = z.output<typeof createSubmissionSchema>;
```

Because the schema transforms, the form's values and the payload it produces are **different types**. React Hook Form's three generics keep them apart:

```ts
const form = useForm<CreateSubmissionFormValues, unknown, CreateSubmissionInput>({
  resolver: zodResolver(createSubmissionSchema),
  defaultValues: { projectName: '', repoUrl: '', liveUrl: '', description: '' },
  mode: 'onBlur',
});
```

**`submissions/repo-url.ts`** — a client-side mirror of the server's `lib/repo-url.ts`, used only to warn the student early that a repository URL is already in their list. The authoritative check is the database unique constraint.

**`use-my-submissions.ts`**

```ts
export function useMySubmissions() {
  return useQuery({
    queryKey: submissionKeys.mine(),
    queryFn: () => listMySubmissions(),
  });
}
```

**`/student/dashboard`** — the student's own submissions.

The page is a Server Component that renders `<MySubmissions />`, a client component that owns the four states:

| State                 | Rendering                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loading               | `loading-skeleton` with card-shaped placeholders                                                                                                                                                                         |
| Error                 | `error-state` with a retry button (`refetch()`)                                                                                                                                                                          |
| Empty (`total === 0`) | `empty-state`: "No submissions yet" + a "Submit your first project" CTA linking to `/student/submissions/new`                                                                                                            |
| Success               | `my-submissions-table` → a `Table` (Project / Status / Submitted); cards below `md`. Search (project name or repo URL) and a status filter run in the browser over the full list returned by `/submissions/me` (§12 #21) |

**`/student/submissions/new`** — the form.

| Field          | Control    | Notes                                                        |
| -------------- | ---------- | ------------------------------------------------------------ |
| Project name   | `Input`    | 3–120 characters, counter shown                              |
| Repository URL | `Input`    | `https://` required; helper text explains the duplicate rule |
| Live link      | `Input`    | Optional                                                     |
| Description    | `Textarea` | 10–4000 characters, counter shown                            |

**Submit flow**

1. `zodResolver(createSubmissionSchema)` validates on blur and on submit.
2. `POST /api/submissions` with the Bearer header attached by the proxy.
3. **201** → toast "Submission received. You'll be notified when it's reviewed." → `router.push('/student/dashboard')`.
4. **409 `DUPLICATE_SUBMISSION`** → inline error under `repoUrl`: "You have already submitted a project with this repository URL." The form **stays populated** so nothing is retyped.
5. **429 `RATE_LIMITED`** → toast; the submit button is disabled until the next attempt.
6. **400 `VALIDATION_ERROR`** → map `details[]` onto fields by `path`.

**Duplicate rule (documented per Requirements §4.2):** one repository URL per student. The server normalises the URL (trim, strip `#hash` and `?query`, drop trailing `/`) before comparing. The client mirrors the normalisation **only** to give an immediate warning — the authoritative check is the database unique constraint.

### 6.3 Feature: `review` (Mentor Dashboard)

**Routes:** `/mentor/dashboard`, `/mentor/submissions`.

**Query state lives in the URL.** `page`, `limit`, and `status` are read from `searchParams` and written back with `router.replace`. Filters and pagination therefore survive a refresh, are shareable, and the back button works.

```
/mentor/submissions?page=2&limit=10&status=APPROVED
```

**`review/params.ts`** — the URL-driven list state.

`page`, `limit` and `status` live in the query string, so a filtered view is shareable and the back button works. That makes the query string **user input**, so every value is parsed defensively before it reaches the API:

```ts
export function parsePage(raw: string | null): number;
export function parseLimit(raw: string | null): number;
export function parseStatus(raw: string | null): SubmissionStatus | undefined;
export function buildListParams(
  current: URLSearchParams,
  changes: ListParamChanges,
): URLSearchParams;
```

`buildListParams` resets to page 1 when the **filter** or the **page size** changes — a filtered list is a new list, and page 4 of the previous filter is meaningless.

**`review/keys.ts`** — a query-key factory. Never inline a key string.

```ts
export const reviewKeys = {
  all: ['review'] as const,
  submissions: () => [...reviewKeys.all, 'submissions'] as const,
  submissionsList: (params: { page: number; limit: number; status?: string | undefined }) =>
    [...reviewKeys.submissions(), 'list', params] as const,
  stats: () => [...reviewKeys.all, 'stats'] as const,
};
```

**`use-submissions.ts`**

```ts
export function useSubmissions(params: ListSubmissionsParams) {
  return useQuery({
    queryKey: reviewKeys.submissionsList(params),
    queryFn: () => listSubmissions(params),
    placeholderData: keepPreviousData, // no layout jump while paginating
  });
}
```

**`/mentor/dashboard`** — statistics.

| Card              | Source           |
| ----------------- | ---------------- |
| Total submissions | `stats.total`    |
| Total pending     | `stats.pending`  |
| Total approved    | `stats.approved` |
| Total rejected    | `stats.rejected` |

`GET /api/mentor/stats` returns `{ stats: { total, pending, approved, rejected } }`. `total` is the sum of all three — it exceeds the required minimum (Requirements §4.3 asks for at least _Total Pending_ and _Total Approved_).

**`/mentor/submissions`** — the paginated table.

| Column    | Source                                                               |
| --------- | -------------------------------------------------------------------- |
| Project   | `projectName` (+ `repoUrl` as an external link)                      |
| Student   | `student.name`, `student.email`                                      |
| Status    | `status-badge`                                                       |
| Submitted | `createdAt` (formatted)                                              |
| Actions   | Approve / Reject buttons — only enabled while `status === 'PENDING'` |

| State            | Rendering                                                     |
| ---------------- | ------------------------------------------------------------- |
| Loading          | Table skeleton (header row + N placeholder rows)              |
| Error            | `error-state` with retry                                      |
| Empty, no filter | "No submissions have been submitted yet."                     |
| Empty, filtered  | "No submissions match this filter." + a "Clear filter" action |
| Success          | Rows + pagination controls                                    |

The page is a Server Component that renders `<SubmissionsExplorer />` (a client component) inside a `<Suspense>` boundary. The explorer owns the URL state, the query, the filter, the table, the pagination, and the review dialog. Below `md` the table becomes a stacked card list — a horizontally scrolling table is unusable on a phone.

**`use-update-status.ts`**

```ts
export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateStatusVariables) => updateStatus(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.stats() });
    },
    onError: error => {
      // Another mentor may have reviewed the same submission first.
      if (error instanceof ApiError && error.code === 'INVALID_STATUS_TRANSITION') {
        queryClient.invalidateQueries({ queryKey: reviewKeys.submissions() });
        queryClient.invalidateQueries({ queryKey: reviewKeys.stats() });
      }
    },
  });
}
```

**Review flow**

1. The mentor clicks **Approve** or **Reject**.
2. A `review-dialog` opens with an optional comment (`Textarea`, max 1000 characters) and an explicit confirm/cancel pair.
3. `PATCH /api/mentor/submissions/:id/status` with `{ status: 'APPROVED' | 'REJECTED', comment? }`.
4. **200** → toast "Submission approved." / "Submission rejected." → the table and stats refetch.
5. **422 `INVALID_STATUS_TRANSITION`** → toast "This submission has already been reviewed." The dialog closes and the list refetches, so the row shows its real state rather than a stale "Pending".
6. **404 `NOT_FOUND`** → the error is shown inline in the dialog.

Only `PENDING → APPROVED | REJECTED` is allowed. Rows that are not `PENDING` render their actions disabled with a tooltip explaining why.

**Review flow**

1. The mentor clicks **Approve** or **Reject**.
2. A `review-dialog` opens with an optional comment (`Textarea`, max 1000 characters) and an explicit confirm/cancel pair.
3. `PATCH /api/mentor/submissions/:id/status` with `{ status: 'APPROVED' | 'REJECTED', comment? }`.
4. **200** → toast "Submission approved." / "Submission rejected." → the table and stats refetch.
5. **422 `INVALID_STATUS_TRANSITION`** → toast "This submission has already been reviewed." and refetch — another mentor got there first.
6. **404 `NOT_FOUND`** → toast "We couldn't find that submission." and refetch.

Only `PENDING → APPROVED | REJECTED` is allowed. Rows that are not `PENDING` render their actions disabled with a tooltip explaining why.

---

## 7. API Contract & Conventions

The browser calls `/api/backend/<path>`; the proxy forwards to `<API_URL>/api/<path>`.

| Method | Browser path                                        | Backend path                         | Access            | Success payload                             |
| ------ | --------------------------------------------------- | ------------------------------------ | ----------------- | ------------------------------------------- |
| GET    | `/api/backend/health`                               | `/api/health`                        | public            | `{ status, nodeEnv, uptimeSeconds }`        |
| POST   | `/api/backend/auth/signup`                          | `/api/auth/signup`                   | public            | `201` — `{ user, token }`                   |
| POST   | `/api/backend/auth/login`                           | `/api/auth/login`                    | public            | `200` — `{ user, token }`                   |
| POST   | `/api/backend/submissions`                          | `/api/submissions`                   | `STUDENT`         | `201` — `{ submission }`                    |
| GET    | `/api/backend/submissions/me`                       | `/api/submissions/me`                | `STUDENT`         | `{ items, total }`                          |
| GET    | `/api/backend/mentor/submissions?page&limit&status` | `/api/mentor/submissions`            | `MENTOR`, `ADMIN` | `{ items, page, limit, total, totalPages }` |
| PATCH  | `/api/backend/mentor/submissions/:id/status`        | `/api/mentor/submissions/:id/status` | `MENTOR`, `ADMIN` | `{ submission }`                            |
| GET    | `/api/backend/mentor/stats`                         | `/api/mentor/stats`                  | `MENTOR`, `ADMIN` | `{ stats }`                                 |
| DELETE | `/api/session`                                      | — (local)                            | —                 | `204` — clears cookies                      |

**Envelopes** — the client never reshapes these:

```jsonc
// success
{ "success": true, "data": { /* payload */ } }

// failure
{ "success": false, "message": "…", "code": "VALIDATION_ERROR", "details": [{ "path": "repoUrl", "message": "Invalid URL" }] }
```

**Status codes the client must handle**

| Code      | Meaning                             | Client behaviour                                |
| --------- | ----------------------------------- | ----------------------------------------------- |
| 200 / 201 | Success                             | Unwrap `data`                                   |
| 400       | Validation failed                   | Map `details[]` onto form fields                |
| 401       | Missing / expired / invalid token   | Clear session → redirect to `/login?next=…`     |
| 403       | Role lacks permission               | Toast + redirect to the role home               |
| 404       | Not found                           | Toast + refetch                                 |
| 409       | Duplicate submission / email exists | Inline error on the relevant field              |
| 422       | Already reviewed                    | Toast + refetch                                 |
| 429       | Rate limited                        | Toast "Too many attempts…" + disable the action |
| 500 / 502 | Server or network failure           | Generic toast + retry button                    |

**Query parameters** for the mentor list: `page` (≥ 1, default 1), `limit` (1–50, default 10), `status` (`PENDING` | `APPROVED` | `REJECTED`, optional).

**Pagination limit:** the client offers 10 / 25 / 50. The server caps at 50; sending more returns `400`.

---

## 8. Routing Map

| Route                      | Access            | Page                                      | Server Component | Client Islands                    |
| -------------------------- | ----------------- | ----------------------------------------- | ---------------- | --------------------------------- |
| `/`                        | public            | Redirect only — no landing page (§12 #10) | ✅               | —                                 |
| `/login`                   | public            | Sign in                                   | ✅               | Login form                        |
| `/signup`                  | public            | Register                                  | ✅               | Signup form                       |
| `/student/dashboard`       | `STUDENT`         | My submissions                            | ✅ (shell)       | Submission list                   |
| `/student/submissions/new` | `STUDENT`         | New submission                            | ✅               | Submission form                   |
| `/mentor/dashboard`        | `MENTOR`, `ADMIN` | Statistics                                | ✅ (shell)       | Stats cards                       |
| `/mentor/submissions`      | `MENTOR`, `ADMIN` | Review table                              | ✅ (shell)       | Table, filter, pagination, dialog |

Route groups `(auth)`, `(student)`, and `(mentor)` do **not** appear in the URL.

**`/` behaviour:** `redirect(session ? roleHome(role) : '/login')`. The session is read server-side, so the redirect happens before anything paints — a signed-out visitor lands on the sign-in page, a signed-in one on their dashboard.

---

## 9. Design System

**shadcn components to use**

| Need     | Component                                                       |
| -------- | --------------------------------------------------------------- |
| Forms    | `Field` family, `Input`, `Textarea`, `Select` (see §2.6)        |
| Layout   | `Card`, `Separator`, `Tabs`, `Sidebar` (the dashboard shell)    |
| Data     | `Table`, `Badge`, `Pagination`, `Skeleton`                      |
| Feedback | `Alert`, `Dialog`, `DropdownMenu`, `Avatar`, `Tooltip`, `Sheet` |
| Actions  | `Button`                                                        |

**Brand palette** — the four Submittly colours, anchored into a Tailwind scale in `globals.css` (§2.5):

| Colour    | Scale       | Where it appears                                  |
| --------- | ----------- | ------------------------------------------------- |
| `#FF0000` | `brand-300` | Logo mark, `destructive`, dark-mode focus ring    |
| `#BC0202` | `brand-500` | `primary` (buttons, active nav), light focus ring |
| `#830000` | `brand-700` | Dark-mode `primary`, hover shades                 |
| `#000000` | `brand-900` | Text, the sidebar background                      |

The dashboard chrome is **"red brand, black chrome"**: a black sidebar (`--sidebar: #000000`) with white text and `#BC0202` for the active item, over white page surfaces. The sidebar is black in both themes.

**Typography** — Raleway via `next/font/google` for sans/heading, Geist Mono for mono (§2.5).

**Status badge colour mapping** (in `components/shared/status-badge.tsx`)

| Status     | Label    | Variant               |
| ---------- | -------- | --------------------- |
| `PENDING`  | Pending  | `secondary` (neutral) |
| `APPROVED` | Approved | `default` (primary)   |
| `REJECTED` | Rejected | `destructive`         |

**Responsive breakpoints**

| Viewport                | Student dashboard    | Mentor table                |
| ----------------------- | -------------------- | --------------------------- |
| `< 768px` (mobile)      | Cards, stacked       | Cards instead of a table    |
| `768px–1024px` (tablet) | Cards, stacked       | Table, horizontal scroll    |
| `≥ 1024px` (desktop)    | Two-column card grid | Full table + filters inline |

The mentor table becomes a stacked card list below `md` — a horizontally scrolling table is unusable on a phone.

**Dark mode** via `next-themes` with `attribute="class"`, `<ThemeProvider>` in the root layout, and a toggle in the app shell. `suppressHydrationWarning` on `<html>`.

**Toasts** via `sonner`, mounted once in the root layout. `<Toaster richColors closeButton position="top-right" />`.

---

## 10. Requirements Traceability

| Requirement                                     | Implementation                                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| §4.1 Login page                                 | `/login` → `use-login` → `POST /auth/login`                                                        |
| §4.1 Signup page for students                   | `/signup` → `use-signup` → `POST /auth/signup` (server assigns `STUDENT`)                          |
| §4.1 JWT authentication                         | Token in the `submittly_token` httpOnly cookie; the proxy attaches the Bearer header               |
| §4.1 RBAC on protected routes                   | Server-side `authorize`; client-side role gates in `src/proxy.ts` (§4.3)                           |
| §4.1 Students cannot reach mentor actions       | `/student/**` and `/mentor/**` are disjoint; the server returns `403` regardless                   |
| §4.2 Form with name / repo / live / description | `/student/submissions/new`, `createSubmissionSchema`                                               |
| §4.2 Robust validation                          | Zod on the client for UX; Zod on the server for truth                                              |
| §4.2 Duplicate prevention                       | Server-side unique `(studentId, normalized repoUrl)` → `409`; the client surfaces it inline (§6.2) |
| §4.2 Rate limiting                              | `submitLimiter` on the server → `429`; the client toasts and disables the action                   |
| §4.2 Clear success / error feedback             | Toast on success; inline field errors and toasts on failure                                        |
| §4.3 Paginated table                            | `/mentor/submissions` + shadcn `Table` + `Pagination`                                              |
| §4.3 Approve / reject                           | `review-dialog` → `PATCH /mentor/submissions/:id/status`                                           |
| §4.3 Server-side filters                        | `status` sent as a query param; filtering happens in the database                                  |
| §4.3 Aggregated statistics                      | `/mentor/dashboard` → `GET /mentor/stats`                                                          |
| §4.4 Statuses                                   | `PENDING` / `APPROVED` / `REJECTED`, mirrored in `types/api.ts` and rendered by `status-badge`     |
| §6 Loading / empty / success / error states     | Every data view has all four (§6.2, §6.3)                                                          |
| §6 Secrets in env vars                          | `API_URL` is server-only; `.env` is git-ignored; `.env.example` documents it                       |
| §9 TypeScript throughout                        | `strict: true` + the flags from §2.3                                                               |
| §9 Responsive, accessible interface             | Tailwind breakpoints (§9); a11y rules in `coding-style.md` §9                                      |
| §9 Server-side pagination and filtering         | `page` / `limit` / `status` are query-string state (§6.3)                                          |
| §9 Authorization on the backend                 | The backend is authoritative; the client only mirrors it for UX                                    |
| §9 README with setup + env docs                 | Outlet 7                                                                                           |

---

## 11. Build Phases

Each outlet is a branch (`feat/<area>-<short-title>`) and ends with a working, demonstrable state.

### Outlet 1 — Scaffold & tooling

- [x] `create-next-app` with `--ts --app --src-dir --tailwind --eslint --import-alias "@/*"`
- [x] `tsconfig.json`: alias → `./src/*`, add `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` (§2.3)
- [x] `shadcn init --base radix --preset nova` + `components.json` matches §2.4; theme tokens in `globals.css` (§2.5)
- [x] 18 shadcn components generated into `src/components/ui/` (incl. `field` + `input-group` — §2.6)
- [x] `prettier` + `prettier-plugin-tailwindcss`; `.prettierrc` matches the server's baseline
- [x] `.env.example` with `API_URL` documented; `.env` git-ignored
- [x] `package.json` `overrides` pins the `effect` peer conflict (§2.1)
- [x] `next.config.ts`: `cacheComponents` off, `partialPrefetching` unset (§12 #11)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` all clean
- [x] `npm run dev` boots and serves HTTP 200

### Outlet 2 — Shared infrastructure

- [x] `src/types/api.ts` (§5.1) — envelopes, domain types, `ApiErrorCode`, `Session`
- [x] `src/lib/api-client.ts` — `apiFetch` + `ApiError` + `getErrorMessage` + 401 handling (§5.2)
- [x] `src/lib/session.ts` — cookie names, `Session` type, `parseSession`, cookie options (§5.4)
- [x] `src/lib/session-server.ts` — server-only `getSession()` / `clearSession()` (§5.4)
- [x] `src/lib/query-client.ts` — `createQueryClient()` factory + shared defaults (§5.3)
- [x] `src/lib/utils.ts` — `cn()`
- [x] `src/app/api/backend/[...path]/route.ts` — the proxy (§4.2)
- [x] `src/app/api/session/route.ts` — `DELETE` clears cookies
- [x] `src/providers/query-provider.tsx` (§5.3), wired into the root layout
- [x] `src/proxy.ts` — role gate (§4.3)
- [x] Smoke: `GET /api/backend/health` returns the upstream envelope verbatim
- [x] Smoke: login sets both httpOnly cookies and **strips the token from the body**
- [x] Smoke: an authenticated call through the proxy reaches the API with the Bearer header
- [x] Smoke: the server still refuses a wrong role (`403 ROLE_FORBIDDEN`) — the client is not the authority
- [x] Smoke: logout clears the cookies; the next call is `401 AUTH_REQUIRED`
- [x] Smoke: `src/proxy.ts` redirects `/student/**` for a non-student, and signed-out users to `/login?next=…`

### Outlet 3 — Feature: `auth`

- [x] `features/auth/{schemas,keys,api,roles,form-error}.ts`
- [x] `features/auth/components/login-form.tsx`, `signup-form.tsx`, `user-menu.tsx`
- [x] `features/auth/hooks/use-login.ts`, `use-signup.ts`, `use-logout.ts`
- [x] `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`
- [x] `components/shared/app-shell.tsx` with the user menu and logout
- [x] `components/shared/page-header.tsx`
- [x] `providers/theme-provider.tsx` (next-themes) + `<Toaster>` (sonner) in the root layout
- [x] `app/(student)/student/layout.tsx`, `app/(mentor)/mentor/layout.tsx` — persona shells
- [x] Placeholder `student/dashboard` and `mentor/dashboard` pages, so the post-login redirect lands somewhere (replaced in Outlets 4/5)
- [x] `/` is role-aware: signed in → `redirect(roleHome(role))`; signed out → the public landing page
- [x] Smoke: signup → 201, cookies written, role `STUDENT`
- [x] Smoke: duplicate email → 409 `EMAIL_ALREADY_EXISTS`
- [x] Smoke: the student dashboard renders with the user's name and the role nav
- [x] Smoke: a student is redirected away from `/mentor/**`; an admin is redirected away from `/student/**`
- [x] Smoke: `/` redirects an admin to `/mentor/dashboard`; a signed-in user is bounced off `/login`
- [x] Smoke: `?next=//evil.com` is rejected — no rendered link contains the hostile host
- [x] Smoke: logout clears the cookies, and the next protected request redirects to `/login?next=…`

### Outlet 4 — Feature: `submissions` (Student Portal)

- [x] `features/submissions/{schemas,keys,api,repo-url}.ts`
- [x] `features/submissions/hooks/use-my-submissions.ts`, `use-create-submission.ts`
- [x] `features/submissions/components/{submission-form,submission-list,submission-card,my-submissions}.tsx`
- [x] `app/(student)/student/submissions/new/page.tsx`; the dashboard now renders the real list
- [x] `components/shared/{empty-state,error-state,loading-skeleton,status-badge}.tsx`
- [x] Smoke: create → 201 → the dashboard lists the new `PENDING` row
- [x] Smoke: a duplicate repo URL for the same student → 409 inline, the form stays populated
- [x] Smoke: the same repo URL for a **different** student → 201 (the rule is per student)
- [x] Smoke: an invalid URL → 400 with `details[]` on `repoUrl`
- [x] Smoke: a blank `liveUrl` is omitted from the payload, not sent as an empty string
- [x] Smoke: an empty dashboard shows the empty state with its CTA
- [x] Verified in a real browser (headless Chrome over CDP): 25/25 checks, including the client-side fetch, the inline errors, and sign-out

### Outlet 5 — Feature: `review` (Mentor Dashboard)

- [x] `features/review/{schemas,keys,api,types,params}.ts`
- [x] `features/review/hooks/use-submissions.ts`, `use-stats.ts`, `use-update-status.ts`
- [x] `features/review/components/{stats-cards,stats-overview,submissions-table,submissions-explorer,status-filter,table-pagination,review-dialog}.tsx`
- [x] `app/(mentor)/mentor/dashboard/page.tsx` (the real one now), `app/(mentor)/mentor/submissions/page.tsx`
- [x] URL-driven `page` / `limit` / `status` state, parsed defensively (`features/review/params.ts`)
- [x] Smoke: the statistics render with real counts
- [x] Smoke: the table shows the student name and email
- [x] Smoke: the status filter is server-side — the URL carries it and every visible row matches
- [x] Smoke: `limit=5` gives 5 rows and the server's `totalPages` drives the pager
- [x] Smoke: the next-page control moves the URL to `page=2` and the table follows
- [x] Smoke: approve → the dialog opens, a comment can be typed, the review is applied
- [x] Smoke: the already-reviewed race → the client shows the message and the list refetches
- [x] Smoke: a student token is refused with `403 ROLE_FORBIDDEN`
- [x] Verified in a real browser (headless Chrome over CDP): 44/44 checks
- [x] URL-driven `page` / `limit` / `status` state
- [x] Smoke: list → 200 with student info; filter → 200; pagination → correct `totalPages`; approve → 200; re-approve → 422 toast; stats reflect the reviews; student token → 403

### Outlet 6 — Polish, states & accessibility

- [x] Every view has loading / empty / error / success states
  - `/student/dashboard` — skeleton, empty state with a CTA, `error-state` with retry, the list
  - `/student/submissions/new` — inline field errors, pending submit state
  - `/mentor/dashboard` — card skeletons, an all-zero empty state, `error-state` with retry
  - `/mentor/submissions` — table skeleton, two empty states (unfiltered / filtered), `error-state` with retry
- [x] Error boundaries: `app/error.tsx`, `app/global-error.tsx`, and one per route group (`(auth)`, `(student)`, `(mentor)`), all sharing `components/shared/error-fallback.tsx`
- [x] `app/not-found.tsx` — a 404 page that offers a way back
- [x] `loading.tsx` for the student and mentor route groups
- [x] Mobile layout: the mentor table becomes cards below `md`
- [x] Dark mode toggle wired through `next-themes`, in the app shell **and** on the signed-out pages
- [x] `prefers-reduced-motion` respected globally
- [x] Keyboard navigation, focus rings, labels on every input
- [x] `npm run lint` clean; `npm run build` clean; no `any` in app code
- [x] Verified in a real browser (headless Chrome over CDP): 21/21 checks — the 404 page, the theme toggle flipping the theme and surviving a navigation, every form control having an accessible name, Tab reaching the email and password fields with a painted focus ring, the reduced-motion rule, and the table/cards swap at a phone viewport

### Outlet 7 — Documentation & acceptance

- [ ] `README.md` — setup, env variables, scripts, how to run the backend alongside
- [ ] `.env.example` up to date
- [ ] Every item of **Requirements §10 Testing Checklist** verified manually in the browser
- [ ] Seeded data: a few students, submissions in each status, and a mentor account (`npm run prisma:seed` on the server)

### Outlet 8 — Brand theme & SaaS dashboard shell _(added post-plan)_

- [x] Brand palette in `globals.css`: `#FF0000` / `#BC0202` / `#830000` / `#000000` anchored into a `brand-*` Tailwind scale, semantic tokens remapped, black sidebar in both themes (§2.5)
- [x] Raleway via `next/font/google` for sans/heading (§12 #17)
- [x] Landing page removed — `/` redirects to `/login` or the role home (§12 #10)
- [x] `npx shadcn add sidebar` — re-downloaded `button`, `separator`, `input`, `skeleton`; added `sidebar`, `tooltip`, `sheet`, `hooks/use-mobile` (§5.6); `TooltipProvider` in the root layout
- [x] `components/shared/dashboard-shell.tsx` — `SidebarProvider` + collapsible icon sidebar (brand mark header, nav slot, role footer, rail) + top bar (`SidebarTrigger`, wordmark, theme toggle, user menu)
- [x] Persona navs as client slots: `features/submissions/components/student-nav.tsx`, `features/review/components/mentor-nav.tsx` (§12 #15)
- [x] Persona layouts carry a second role check; old `app-shell.tsx` deleted
- [x] `(auth)` layout carries the brand mark; `not-found.tsx` copy updated for the `/` → `/login` flow
- [x] Full-screen split auth pages — promo slide panel (right) + full form column (left), no `(auth)` group layout, theme toggle in the form column; signup matches login (§12 #18)
- [x] One-click demo-account sign-ins on `/login` — student + mentor, filled into the visible form, routed to each role home (§12 #19)
- [x] `apiFetch` 401 teardown skipped for `/auth/*` so a failed sign-in shows its inline toast/error instead of reloading (§12 #20)
- [x] My submissions as a table (cards below `md`) with **client-side** search (name or repo URL) and status filter; old `submission-list`/`submission-card` removed; `StatusFilter` promoted to `components/shared/` (§12 #21)
- [x] `lint` / `typecheck` / `build` clean

---

## 12. Open Decisions Log

| #   | Area                      | Decision                                                                               | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Token storage             | httpOnly `submittly_token` cookie + server-side proxy                                  | The token never reaches browser JS; CORS is never exercised                                                                                                                                                                                                                                                                                                                                                                                     |
| 2   | Role gating               | Separate httpOnly `submittly_session` cookie, read by `src/proxy.ts`                   | Holds no secret; avoids re-verifying the JWT on every navigation                                                                                                                                                                                                                                                                                                                                                                                |
| 3   | Middleware naming         | `src/proxy.ts` (not `middleware.ts`)                                                   | Next.js 16 renamed the convention; `middleware.ts` is deprecated                                                                                                                                                                                                                                                                                                                                                                                |
| 4   | Server state              | TanStack Query v5                                                                      | Cache, invalidation, and explicit states without hand-rolled `useEffect` fetching                                                                                                                                                                                                                                                                                                                                                               |
| 5   | Rendering                 | Server Components by default; `'use client'` only on interactive islands               | Matches Next.js guidance and keeps the JS payload small                                                                                                                                                                                                                                                                                                                                                                                         |
| 6   | Pagination & filter state | `searchParams` (URL-driven)                                                            | Shareable URLs, working back button, server stays authoritative                                                                                                                                                                                                                                                                                                                                                                                 |
| 7   | Pagination UI             | shadcn `Table` + `Pagination` — no `@tanstack/react-table`                             | The table needs no client-side sorting or row selection                                                                                                                                                                                                                                                                                                                                                                                         |
| 8   | Schema sharing            | **Duplicate** the server's Zod schemas in `features/*/schemas.ts`                      | A shared package would need a monorepo; duplication is the smaller change. **Risk: drift.** Mitigation — the server and client schemas live in adjacent files with identical constraint text, and any server-side rule change updates both in the same PR. Revisit if a third consumer appears.                                                                                                                                                 |
| 9   | Review comment            | Optional, in the confirm dialog, max 1000 characters                                   | Matches the server's `updateStatusSchema` exactly                                                                                                                                                                                                                                                                                                                                                                                               |
| 10  | Landing page              | **None** — `/` is a redirect only: signed out → `/login`, signed in → `roleHome(role)` | The product has no marketing surface; the sign-in page _is_ the entry point. `not-found.tsx` links to `/`, which now lands on `/login`                                                                                                                                                                                                                                                                                                          |
| 11  | Cache Components          | `cacheComponents` **off**; `partialPrefetching` unset                                  | Enabling Cache Components is not a rename-only change — it requires adopting the Cache Components model and surfaces build errors for uncached data outside `<Suspense>`. `partialPrefetching` throws at config validation without it. The app reads cookies for the session and leans on TanStack Query, so the default dynamic model is the predictable fit. Revisit in Outlet 6.                                                             |
| 12  | Form primitives           | shadcn v4 `<Field>` family + react-hook-form `<Controller>`                            | shadcn v4 removed the old `Form` component. `Field` gives explicit control over markup while keeping accessibility (`data-invalid`, `aria-invalid`, `FieldError`) — see §2.6                                                                                                                                                                                                                                                                    |
| 13  | Radix packaging           | The unified `radix-ui` package, not individual `@radix-ui/*`                           | This is what shadcn v4 installs; matching it avoids duplicate primitives                                                                                                                                                                                                                                                                                                                                                                        |
| 14  | `effect` peer conflict    | Pinned via `package.json` `overrides`                                                  | `@hookform/resolvers@6` declares an optional `effect@^4` peer that contradicts the `@typeschema` chain's `effect@^3`. The zod resolver never touches `effect`. Using `--legacy-peer-deps` instead would disable peer checking project-wide.                                                                                                                                                                                                     |
| 15  | Sidebar nav architecture  | The shell takes the nav as a **React element slot** (`sidebar: ReactNode`), not data   | Icon components cannot be serialised across the server → client boundary, so nav data (href + icon) cannot live in a server layout. Each persona feature owns a small `'use client'` component (`student-nav.tsx`, `mentor-nav.tsx`) that renders its own `SidebarMenu`, icons, and `usePathname` active state. The shared shell stays persona-agnostic.                                                                                        |
| 16  | `useIsMobile` hook        | Replaced shadcn's `useState`+`useEffect` version with `useSyncExternalStore`           | shadcn's stock hook calls `setState` inside the effect body, which `react-hooks/set-state-in-effect` forbids. The hook is in `src/hooks/`, not `src/components/ui/`, so rewriting it does not violate the "do not edit generated ui components" rule (§5.6).                                                                                                                                                                                    |
| 17  | Typography                | **Raleway** (`next/font/google`) for sans/heading; Geist Mono for mono                 | User-selected brand font. Font tokens in `globals.css` point at the `next/font` CSS variables (§2.5)                                                                                                                                                                                                                                                                                                                                            |
| 18  | Auth pages                | **Full-screen split**: promo slide panel (right) + full form column (left)             | `features/auth/components/promo-slides.tsx` is a self-cycling carousel (pauses on hover/focus, dot navigation). The `(auth)` route group has **no `layout.tsx`** — each page owns its full-height shell, which also prevents a nested `<main>`. The theme toggle lives in the form column's top-right corner; the promo panel is hidden below `lg`                                                                                              |
| 19  | Demo accounts             | One-click sign-ins on `/login` (`features/auth/demo-accounts.ts`)                      | Clicking a demo button fills the visible form and signs in via the normal `useLogin` flow → routes to the role home. The credentials are throwaway, public demo accounts mirroring the server's seed env; rotate the seed and this file together.                                                                                                                                                                                               |
| 20  | 401 teardown scope        | `endSession()` **skips `/auth/*` endpoints**                                           | A failed sign-in returns 401 while the user is already signed out — tearing down and hard-navigating would reload the page and destroy the inline failure feedback. Session teardown still applies to every other endpoint (the original hard-navigation rule, refined).                                                                                                                                                                        |
| 21  | Student list filtering    | Search + status filter run **in the browser** on My submissions                        | `/submissions/me` returns the student's _entire_ list (the token scopes it), so filtering locally shows every row with no server round-trip — unlike the mentor table, whose server response is paginated and must be filtered server-side. The control set mirrors the mentor table on purpose; `StatusFilter` moved to `components/shared/` for the same reason. Revisit server-side filtering only if a student's own list ever grows large. |
