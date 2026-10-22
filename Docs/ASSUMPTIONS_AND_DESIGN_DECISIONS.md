# Assumptions & Design Decisions

**Project:** Project Submission & Review Dashboard  
**Assessment:** Associate Web Instructor — Hiring Task  
**Status:** Proposed MVP decisions; subject to change if requirements are clarified.

> **Implementation status (read this first).** This document records the assumptions made _before_ implementation; it is intentionally kept as a proposal. During implementation a few choices were tightened or adjusted — the final, authoritative decisions live in the per-app logs: [`Client-side/docs/implementation-plan.md`](../Client-side/docs/implementation-plan.md) §12 and the server's `docs`. The deltas between proposal and implementation:
>
> - **Duplicate rule (Decision 06):** implemented by normalizing the repo URL _before_ storage and enforcing `@@unique([studentId, repoUrl])` — no separate `normalizedRepoUrl` column.
> - **Validation bounds (Decision 07):** implemented as project name 3–120 characters and description 10–4,000 characters.
> - **Feedback (Decision 12):** implemented as optional for _both_ approve and reject (the mentor never blocks an approval on a comment).
> - **Token (Decision 04):** implemented as a 7-day HS256 access token, delivered to the client's server-side proxy which holds it in an httpOnly cookie — the token never reaches browser JavaScript.
> - **API contract (§9):** implemented as `/api/submissions/me`, `/api/mentor/submissions`, `PATCH /api/mentor/submissions/:id/status`, `/api/mentor/stats` — see [`Server-side/README.md`](../Server-side/README.md) for the real reference.

## 1. Purpose

The hiring brief intentionally leaves some details undefined. This document records the assumptions made to implement a secure, maintainable MVP without expanding the scope unnecessarily.

> **Important:** The decisions below are **implementation assumptions**, not explicit requirements from the hiring brief. Where a requirement is explicit, it is identified separately.

## 2. Explicit Requirements from the Hiring Brief

- **Stack:** TypeScript; Next.js, Tailwind CSS, shadcn/ui; Express.js; PostgreSQL with Prisma ORM; JWT-based role-based access control (RBAC).
- **Student portal:** Submit project name, repository URL, live link, and description; validate input; prevent duplicates; apply basic rate limiting.
- **Mentor dashboard:** Paginated submission table; approve/reject actions; **server-side** Approved/Rejected filters; aggregated statistics (for example, Pending and Approved counts).
- **Authentication:** Login, student signup, and an Admin account seeded directly into the database.

## 3. Roles and Access Control

### Decision 01 — Roles

**Ambiguity:** The brief mentions Student, Mentor, and a seeded Admin without defining their complete relationship.

**Decision:** Implement three roles: `STUDENT`, `MENTOR`, and `ADMIN`. Student registration always creates a `STUDENT` account; reviewers are provisioned by seeding. Seed the required Admin account and a Mentor test account.

**Reason:** Separating roles makes the intended Student-versus-Mentor access rules clear, while satisfying the requirement for a seeded Admin.

### Decision 02 — Admin Permissions

**Ambiguity:** The Admin's actual capabilities are not specified.

**Decision:** For this MVP, Admin can access the review dashboard and perform the same review actions as a Mentor. Do not build a separate Admin management UI.

**Reason:** Gives the seeded account a useful purpose without inventing an administration module.

### Decision 03 — Student Data Visibility

**Ambiguity:** It is unclear whether students can view other students' submissions.

**Decision:** A Student may create submissions and view **only their own** submissions. Mentors and Admins may view all submissions needed for review.

**Reason:** Follows least-privilege access and prevents unintended exposure of other students' data.

### Permission Matrix

| Capability                           | Student | Mentor | Admin |
| ------------------------------------ | :-----: | :----: | :---: |
| Sign up through public form          |   Yes   |   No   |  No   |
| Log in                               |   Yes   |  Yes   |  Yes  |
| Create submission                    |   Yes   |   No   |  No   |
| View own submissions                 |   Yes   |   No   |  No   |
| View all submissions                 |   No    |  Yes   |  Yes  |
| Filter and paginate review list      |   No    |  Yes   |  Yes  |
| Approve or reject pending submission |   No    |  Yes   |  Yes  |
| View review statistics               |   No    |  Yes   |  Yes  |

**Security rule:** Authorization must be enforced on Express routes and against database resource ownership, not only by hiding frontend pages or buttons.

## 4. Authentication Decisions

### Decision 04 — JWT Lifecycle

**Ambiguity:** Token expiry, persistence, and refresh behavior are not defined.

**Decision:** Use a signed, short-lived access JWT (for example, 15 minutes). For a browser-based MVP, deliver it in an `HttpOnly`, `Secure` cookie with an appropriate `SameSite` policy in production. Do not implement refresh tokens initially; users log in again after expiry. In development, adapt `Secure` for local HTTP only.

**Reason:** Keeps the demonstration simple while avoiding JavaScript-accessible token storage. Cookie-based authentication also requires proper CSRF/origin protections for state-changing requests.

**Verification:** The server verifies JWT signature, algorithm, expiration, and expected issuer/audience where configured. The server never trusts a role or user ID supplied in a request body or query string.

**Role changes:** Signed JWT role claims can become stale until expiry. For this small MVP, short token lifetime limits that window; immediately revocable roles/sessions would require a server-side lookup or revocation mechanism.

## 5. Student Submission Decisions

### Decision 05 — Number of Submissions

**Ambiguity:** The brief does not state whether students may submit one or multiple projects.

**Decision:** A Student may submit multiple **different** projects.

**Reason:** Supports multiple projects without imposing an unsupported one-submission-only rule.

### Decision 06 — Duplicate Definition

**Ambiguity:** “Duplicate submission” is not defined.

**Decision:** Reject a second submission when the **same student** submits the **same normalized repository URL**, even if the project name changes.

**Example:** `https://github.com/alex/shop` and `https://github.com/alex/shop/` should be treated as the same repository for that student.

**Implementation:** Normalize supported URL formatting consistently before saving; store `normalizedRepoUrl` and enforce a compound unique database constraint on `(studentId, normalizedRepoUrl)`. Translate unique-constraint violations to a user-friendly `409 Conflict` response. A frontend-only duplicate check is insufficient because concurrent requests can race.

**Reason:** Repository identity is more reliable than a project title, and a database constraint ensures correctness.

### Decision 07 — Input Validation

**Ambiguity:** Required fields and validation rules are not specified.

**Decision:** Apply these proposed rules in both client and server validation:

| Field          | MVP Rule                                                                      |
| -------------- | ----------------------------------------------------------------------------- |
| Project name   | Required; trim whitespace; 3–100 characters                                   |
| Repository URL | Required; valid `https://` or `http://` URL; normalize before duplicate check |
| Live link      | Optional; if present, must be a valid `https://` or `http://` URL             |
| Description    | Required; trim whitespace; 20–2,000 characters                                |

The server remains the source of truth; client-side validation provides faster feedback.

**Reason:** Clear bounds improve usability and prevent malformed data. Limits are proposed defaults, not values specified in the brief.

### Decision 08 — Editing and Deleting

**Ambiguity:** The brief does not say whether submitted projects may later be edited or deleted.

**Decision:** Submissions are read-only after creation in the MVP. No student edit/delete feature is provided.

**Reason:** Avoids undefined review-state behavior and keeps scope focused on the required submit-and-review workflow.

### Decision 09 — Submission Rate Limit

**Ambiguity:** The maximum allowed request rate is unspecified.

**Decision:** Allow up to **5 submission attempts per authenticated student per 15-minute window**. Return `429 Too Many Requests` on excess requests. Protect unauthenticated auth endpoints with separate IP-based limits as a security enhancement if time permits.

**Reason:** Provides basic anti-spam protection without blocking typical student use.

**Operational note:** An in-memory limiter is acceptable for a single-instance assessment demo; a shared store would be required to enforce consistent limits across multiple server instances.

## 6. Mentor Review Decisions

### Decision 10 — Initial Review Status

**Ambiguity:** The initial submission state is not explicit.

**Decision:** New submissions start at `PENDING`.

**Reason:** They should require a reviewer decision before becoming Approved or Rejected.

### Decision 11 — Allowed Status Transitions

**Ambiguity:** The brief does not specify whether a Mentor can reverse earlier decisions.

**Decision:** Permit only these transitions:

```text
                 +----------+
Student submits ->| PENDING  |
                 +----------+
                   /      \
                  v        v
            +----------+ +----------+
            | APPROVED | | REJECTED |
            +----------+ +----------+
```

Only `PENDING` submissions can be approved or rejected. Decisions are final for this MVP; re-review and resubmission workflows are out of scope.

**Reason:** This is easy to explain, test, and enforce. Status updates must be conditional/transactional to avoid two reviewers overwriting each other's decisions.

### Decision 12 — Rejection Feedback

**Ambiguity:** A rejection reason is not explicitly required.

**Decision:** A reviewer must supply non-empty feedback when rejecting. Feedback is optional when approving.

**Reason:** Rejection feedback makes decisions actionable for students.

### Decision 13 — Pagination and Sorting

**Ambiguity:** No default page size or ordering is provided.

**Decision:** Use server-side pagination with a default page size of **10**, sorted by **newest submission first**; validate page and page-size parameters on the server.

**Reason:** Provides predictable UX and avoids loading the full table at once.

### Decision 14 — Status Filtering and Statistics

**Ambiguity:** It is unclear whether dashboard statistics should reflect the filtered table or the entire system.

**Decision:** Filters (`PENDING`, `APPROVED`, `REJECTED`, or All) affect the **paginated list** only. Summary cards show **global totals**, independent of the current list filter.

**Reason:** Prevents dashboard totals from changing unexpectedly when a reviewer filters the table.

### Decision 15 — Reviewer Assignment and Audit

**Ambiguity:** The brief does not state which Mentor may review which submission or what must be recorded.

**Decision:** Any authorized Mentor or Admin can review any `PENDING` submission. Store the reviewer, decision, optional feedback, and review timestamp.

**Reason:** Avoids inventing an assignment system and provides basic accountability.

## 7. Data Model Decision

Use the following minimal entities:

```text
User (1) -------- (many) Submission
User (1) -------- (many) Review [as reviewer]
Submission (1) -- (0..1) Review [MVP: one final review]
```

| Entity       | Suggested Fields                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| `User`       | `id`, `name`, `email` (unique), `passwordHash`, `role`, `createdAt`                                                |
| `Submission` | `id`, `studentId`, `projectName`, `repoUrl`, `normalizedRepoUrl`, `liveLink`, `description`, `status`, `createdAt` |
| `Review`     | `id`, `submissionId` (unique for MVP), `reviewerId`, `decision`, `feedback`, `createdAt`                           |

**Design choice:** A separate `Review` table makes the reviewer relationship and feedback explicit. The `Submission.status` field supports efficient listing and statistics. Keep both synchronized in one database transaction. Although a review-history model could allow multiple reviews later, **the MVP enforces at most one final review per submission**.

## 8. Technical Design Decisions

| Area                | Decision                                              | Reason                                                              |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------------------------- |
| Backend structure   | Express routes/controllers + small service layer      | Separates HTTP concerns from business logic without overengineering |
| Request validation  | Zod schemas; validate again on server                 | Predictable input validation and meaningful errors                  |
| Database access     | Prisma ORM; PostgreSQL constraints                    | Type-safe queries and database-enforced integrity                   |
| AuthN               | JWT verification middleware                           | Centralizes authentication checks                                   |
| AuthZ               | Role checks + resource ownership checks               | Prevents unauthorized access and IDOR issues                        |
| Password storage    | Argon2id or bcrypt hashes; never plain-text passwords | Secure credential handling                                          |
| Pagination          | Prisma `skip`/`take` with stable sort                 | Simple server-side pagination                                       |
| Server-side filters | Prisma `where` based on validated query inputs        | Matches explicit assessment requirement                             |
| Statistics          | Prisma aggregates/counts                              | Avoids fetching all rows just to count statuses                     |
| Error responses     | Consistent status code and message format             | Easier debugging and better frontend feedback                       |
| UI feedback         | Loading, success, empty, and error states             | Clear user experience                                               |

**Practical note:** Prioritize functional correctness over introducing repositories, queues, caches, or extra services that are unnecessary for this assessment.

## 9. Suggested API Contract (Proposed)

These routes are implementation choices, **not required endpoint names** from the brief.

| Method  | Route                          | Access        | Purpose                            |
| ------- | ------------------------------ | ------------- | ---------------------------------- |
| `POST`  | `/api/auth/signup`             | Public        | Register Student                   |
| `POST`  | `/api/auth/login`              | Public        | Authenticate user                  |
| `POST`  | `/api/auth/logout`             | Authenticated | End browser session / clear cookie |
| `POST`  | `/api/submissions`             | Student       | Create a submission                |
| `GET`   | `/api/submissions/mine`        | Student       | View own submissions               |
| `GET`   | `/api/reviews/submissions`     | Mentor, Admin | Paginated/filterable review list   |
| `PATCH` | `/api/reviews/submissions/:id` | Mentor, Admin | Approve/reject pending submission  |
| `GET`   | `/api/reviews/statistics`      | Mentor, Admin | Global dashboard counts            |

## 10. Out of Scope for the MVP

- Public Mentor/Admin registration and user-management screens.
- Password reset, email verification, and multi-factor authentication.
- Token refresh/session management beyond the basic access-token approach.
- Editing or deleting submitted projects.
- Reviewer assignment, review appeals, and reopening final decisions.
- Notifications, email delivery, file uploads, and advanced analytics.
- Distributed caching or distributed rate limiting for multi-instance production deployment.

These could be future improvements; they are **not** presented as assessment requirements.

## 11. Key Acceptance Checks

- A new public signup always creates a Student account, regardless of any submitted role value.
- A Student can submit valid project details but cannot access Mentor endpoints.
- Two equivalent repository URLs from the same Student cannot be stored as separate submissions, even under concurrent requests.
- Input validation occurs on the server and returns useful field-level errors.
- Excess submission attempts return `429`.
- A Mentor can filter and paginate on the server and view global status counts.
- A Mentor can approve/reject a Pending submission, and only one final decision is stored.
- An unauthenticated or unauthorized request cannot change review state.
- A Student cannot view another Student's submission via ID manipulation.
- The seeded Admin can log in and use the authorized review flow.

---

**Documentation principle:** When a reviewer asks why something works this way, point to the corresponding numbered decision above. Keep this document updated if assumptions change during implementation.
