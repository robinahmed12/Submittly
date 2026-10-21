# Project Name: Submittly

**Submittly** is a Project Submission and Review Dashboard for students and mentors. Students submit project details and track review status, while mentors review submissions and approve or reject them.

## 1. Project Objective

Build a secure full-stack web application that lets students submit project information and lets mentors review submissions through a dashboard. The application must implement authentication, role-based access control (RBAC), validation, duplicate-submission prevention, rate limiting, server-side filtering, pagination, and aggregated statistics.

## 2. Required Technology Stack

- **Language:** TypeScript
- **Frontend:** Next.js, Tailwind CSS, shadcn/ui
- **Backend:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT-based authentication and role-based access control (RBAC)
- **validation:** Zod

## 3. User Roles

### Student
- Sign up for an account.
- Log in and log out.
- Submit project details.
- View their submission status and relevant submission information.

### Mentor
- Log in to the review dashboard.
- View project submissions in a paginated table.
- Filter submissions by status using server-side filtering.
- Approve or reject submissions.
- View aggregated submission statistics.

### Admin
- An admin account may be seeded directly in the database, as permitted by the task.
- Additional admin features are not specified in the original task and are optional unless needed by the implementation.

## 4. Functional Requirements

### 4.1 Authentication
- Provide a login page.
- Provide a signup page for students.
- Use JWT-based authentication.
- Enforce role-based access control on protected backend routes.
- Prevent student accounts from accessing mentor-only actions.

### 4.2 Student Submission Portal
Provide a form with the following fields:

- **Project name**
- **Repository URL**
- **Live link**
- **Description**

The submission flow must:
- Validate submitted data robustly.
- Prevent duplicate submissions.
- Apply basic rate limiting to reduce spam.
- Return clear success and validation/error feedback to the user.

> **Implementation decision to document:** The task does not define what makes a submission a duplicate. Choose and document a rule, such as allowing only one submission per student for a given repository URL, and enforce it on the server/database as appropriate.

### 4.3 Mentor Review Dashboard
The dashboard must include:
- A paginated data table of project submissions.
- Actions to approve or reject a submission.
- Server-side filters for **Approved** and **Rejected** projects.
- Aggregated statistics, including at least **Total Pending** and **Total Approved**.

For consistent behavior, the implementation may also show **Total Rejected** and **Total Submissions**.

### 4.4 Submission Status
Use clear statuses for submissions, at minimum:
- `PENDING`
- `APPROVED`
- `REJECTED`

New submissions should normally start as `PENDING`. Only authorized users should be able to change review status.

## 5. Suggested Data Model

The original task requires PostgreSQL through Prisma and mentions Users, Submissions, and Feedback as possible video-topic entities. It does not prescribe an exact schema. The following is a suggested starting point.

### User
- `id`
- `name`
- `email` (unique)
- `passwordHash`
- `role` (for example, `STUDENT`, `MENTOR`, `ADMIN`)
- `createdAt`
- `updatedAt`

### Submission
- `id`
- `studentId` (relation to the submitting user)
- `projectName`
- `repoUrl`
- `liveUrl`
- `description`
- `status`
- `createdAt`
- `updatedAt`

### Feedback
- `id`
- `submissionId`
- `mentorId`
- `comment`
- `createdAt`


## 6. Validation, Security, and Reliability

- Validate all incoming data on the backend; frontend validation is for usability and does not replace server validation.
- Normalize and validate email addresses.
- Store password hashes, never plaintext passwords.
- Verify JWT signatures and expiration.
- Enforce permissions on the server, not only by hiding frontend UI elements.
- Verify access to the specific submission before updating it.
- Prevent duplicate submissions with a clearly documented rule.
- Apply basic rate limiting to submission and/or authentication endpoints.
- Use appropriate HTTP status codes and clear error messages.
- Keep secrets and database credentials in environment variables; do not commit `.env` files.
- Handle loading, empty, success, and error states in the UI.

## 7. API Requirements (Suggested Design)

These routes are a proposed implementation plan, not routes explicitly mandated by the task.

### Authentication
- `POST /api/auth/signup` — student signup
- `POST /api/auth/login` — login

### Student Submissions
- `POST /api/submissions` — create a submission (authenticated student)
- `GET /api/submissions/me` — list the current student's submissions

### Mentor Review
- `GET /api/mentor/submissions` — paginated submissions with server-side status filtering
- `PATCH /api/mentor/submissions/:id/status` — approve or reject a submission
- `GET /api/mentor/stats` — aggregated statistics

Possible query parameters for the mentor list:
- `page`
- `limit`
- `status` (`PENDING`, `APPROVED`, or `REJECTED`)

## 8. UI Pages

Suggested pages:
- `/signup`
- `/login`
- `/student/dashboard`
- `/student/submissions/new`
- `/mentor/dashboard`
- `/mentor/submissions`

The final route structure may vary as long as the required workflows are implemented.

## 9. Non-Functional Requirements

- Use TypeScript throughout the frontend and backend.
- Use a clear separation of concerns between routes, middleware, services, and database access where appropriate.
- Provide a responsive, accessible interface using Tailwind CSS and shadcn/ui.
- Show loading, empty, validation, and server-error states.
- Use server-side pagination and status filtering for mentor submissions.
- Keep authorization checks on the backend.
- Include setup instructions and environment-variable documentation in the README.

## 10. Testing Checklist

- [ ] Student can sign up and log in.
- [ ] Invalid login credentials are rejected.
- [ ] A student can submit a project with valid data.
- [ ] Invalid project data is rejected by the backend.
- [ ] Duplicate submissions are prevented according to the documented rule.
- [ ] Rate limiting is active.
- [ ] A student cannot access mentor-only routes.
- [ ] A mentor can view paginated submissions.
- [ ] Approved and Rejected filters are applied on the server.
- [ ] A mentor can approve or reject a submission.
- [ ] Dashboard statistics reflect current submission statuses.
- [ ] Unauthorized users cannot update submission status.
- [ ] UI handles loading, empty, and error states.


## 13. Recommended Project Name

**Submittly** — short, easy to remember, and relevant to project submissions.


---

## Scope Notes

The required features and technology stack above are derived from the provided hiring-task document. Items explicitly marked as suggested, optional, or implementation decisions are recommendations to help structure the work; they are not stated as mandatory requirements in the original document.
