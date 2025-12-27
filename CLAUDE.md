# CLAUDE
Guidelines for assisting with **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** projects. Follow these rules unless the project’s own docs explicitly say otherwise.

## Purpose
Provide consistent, reliable help on Next.js projects. Prefer clarity, safety, and maintainability over cleverness.

## Use Context7 to Find Docs
Automatically use context7 for code generation and library documentation.

## Nextjs Codebase Considerations
This codebase uses Next.js with the App Router. You will typically be working in:
- `app/` (routes, layouts, pages, route handlers, server actions)
- `components/` (reusable UI, client/server components, shadcn/ui)
- `lib/` (utilities, auth, db, config, API clients)
- `styles/` (global and Tailwind configuration)
- `tests/` (unit, integration, e2e)

## Project Awareness & Context
- At the start of each session:
  - Read `PLANNING.md` for architecture, goals, and constraints.
  - Read `TASK.md` for the active task list. If a task isn’t listed, add it with a one-line description and today’s date.
  - Skim `README.md` and `CONTRIBUTING.md` if available for setup and workflow standards.
- Use the project’s package manager (`pnpm` preferred; else `yarn` or `npm`).
- Match the Node version in `.nvmrc` or `package.json`.

## Environment & Tooling
- Activate the correct Node environment (`nvm use` if `.nvmrc` exists).
- Centralize configs: `tsconfig.json`, `next.config.*`, `tailwind.config.*`, `.eslintrc.*`, `.prettierrc.*`.
- Provide `.env.example` with all required environment variables.
- Use TypeScript strict mode for safety.

## Code Structure & Modularity
- Organize by **layer and responsibility**, not just “features.”
- Common layout:
```
app/
├── layout.tsx
├── page.tsx
├── (marketing)/...
├── (dashboard)/...
components/
├── ui/ # shadcn primitives
├── common/ # shared components (buttons, modals, forms)
└── domain/ # more complex domain-specific UI
lib/
├── utils.ts
├── auth.ts
├── db.ts
└── config.ts
styles/
└── globals.css
tests/
├── unit/
├── integration/
└── e2e/
```

- Keep components small (<300 LOC). Split large ones into sub-components.
- Use **Server Components by default**. Mark Client Components explicitly with `"use client"`.

## Dependencies
- Pin direct dependencies. Use `pnpm-lock.yaml` (or equivalent) for reproducibility.
- Minimize client bundle size; avoid shipping heavy client-side libs.
- Use `zod` for input validation.

## Configuration & Secrets
- Load all configuration from `process.env`. Provide sensible defaults for dev.
- Never commit secrets. `.env` must be in `.gitignore`.
- Encapsulate environment access in `lib/config.ts` with typed getters.

## Testing & Reliability
- Unit/Integration: Jest or Vitest with Testing Library.
- E2E: Playwright or Cypress.
- For each new component or API route, add:
  - one expected-use test
  - one edge case
  - one failure case
- Aim for meaningful coverage (~85%). Add regression tests when fixing bugs.

## Quality Gates
- Static checks before commit:
  - `eslint` for linting
  - `prettier` for formatting
  - `tsc --noEmit` for type checking
- Add a `pre-commit` config to enforce above locally and in CI.
- CI must run: install, type-check, lint, test, and build.

## Logging, Errors, Observability
- Use error boundaries (`error.tsx`) at route level.
- Log and propagate server errors clearly in Route Handlers and server actions.
- For APIs, return typed responses with appropriate HTTP codes.
- Integrate monitoring/analytics hooks (e.g., Vercel analytics, Sentry).

## Style & Conventions
- TypeScript strict mode required.
- Use ESLint + Prettier as configured in repo.
- Tailwind for styling; extend via `tailwind.config.*`.
- Use shadcn/ui primitives where possible.
- Accessibility:
  - Ensure keyboard navigation, ARIA attributes, and focus management.
  - Respect WCAG 2.1 AA standards.
- SEO:
  - Implement `generateMetadata` for pages.
  - Include OG/social tags and canonical URLs.
- Use `next/image` and `next/font` best practices.

## Documentation
- Add comments for non-obvious logic.
- Document component props and expected behavior.
- Keep `README.md` up to date with scripts and conventions.
- **IMPORTANT:** Always add Update CLAUDE.md as the last task.

---

## Palm Project-Specific Guidelines

### Project Architecture
Palm is a meal/macro tracking application with the following structure:
```
palm/
├── backend/                    # Docker Compose for PostgreSQL
├── frontend/
│   ├── mobile/ios/            # Future iOS app (not yet implemented)
│   └── web/                   # Next.js 16 App Router application
│       ├── app/               # Routes, layouts, API handlers
│       ├── components/        # UI components (ui/, common/, domain/)
│       ├── lib/               # Utilities (prisma, auth, gcs, config)
│       └── prisma/            # Database schema
└── PRPs/                      # Product Requirement Plans
```

### Key Technologies
- **Next.js 16** with App Router
- **Prisma** ORM with PostgreSQL
- **Auth.js v5** (NextAuth) with Google OAuth
- **Google Cloud Storage** for meal images
- **shadcn/ui** for UI components
- **Zod** for validation
- **TanStack Table** for data tables
- **Recharts** for radial charts

### Database Models
- **User**: email, firstName, lastName, activePlanId, sharingEnabled
- **Meal**: macros (proteins, fats, carbs, veggies, junk), image, dateTime, mealCategory, notes
- **Plan**: name, slot allocations (protein, fat, carb, veggie, junk)
- **Note**: text, linked to Meal
- **Follow**: follower-following relationship between users
- **FollowRequest**: pending follow requests with token-based email verification

### REST API Pattern
All API routes under `/app/api/rest/v1/`:
- Always validate with Zod
- Check auth with `auth()` from `@/lib/auth`
- Use `revalidatePath()` after mutations
- Return typed JSON with `{ data, meta }` or `{ error }` structure

### GCS Integration
- Images stored as `gs://bucket/meals/{userId}/{mealId}/{filename}`
- Use `lib/gcs.ts` for upload/download operations
- Generate signed URLs for viewing (1 hour expiry)
- Server-side only (never import in client components)

### Authentication
- Google OAuth via Auth.js
- Middleware protects all routes except `/`, `/signin`, `/error`, `/share/*`
- Share pages are public (no auth required)
- User created/updated in DB on successful sign-in

### Dashboard Features
- Radial chart showing daily macro slot usage vs active plan
- Sidebar navigation: Home, Meals, Plans, Settings
- Quick add meal button
- Today's meals summary

### Share Feature
- Public URL: `/share/{userId}`
- No authentication required for viewers
- Gallery view of meals with sorting/filtering
- Click to view meal details with macros and notes

### Follow System & Feed
The follow system allows users to connect with trainers, nutritionists, or friends to share and view meal logs.

**Request Types:**
- `FOLLOW`: "I want to follow your meals" - requester sees target's meals
- `INVITE`: "Please follow my meals" - target sees requester's meals

**Flow:**
1. User enters email and selects request type in Settings
2. System generates secure token and sends email via Resend
3. Recipient clicks link in email → signs in if needed → accepts/rejects
4. On accept: Follow relationship created

**API Endpoints:**
- `POST /api/rest/v1/follow-requests` - Send a follow request/invitation
- `GET /api/rest/v1/follow-requests` - List pending requests (sent/received)
- `GET /api/rest/v1/follow-requests/[token]` - Get request details
- `POST /api/rest/v1/follow-requests/[token]/accept` - Accept request
- `POST /api/rest/v1/follow-requests/[token]/reject` - Reject request
- `GET /api/rest/v1/following` - List users I'm following
- `GET /api/rest/v1/followers` - List users following me
- `DELETE /api/rest/v1/following/[userId]` - Unfollow a user
- `DELETE /api/rest/v1/followers/[userId]` - Remove a follower
- `GET /api/rest/v1/feed` - Get combined meals from all followed users

**Pages:**
- `/feed` - Unified feed showing meals from all followed users
- `/follow/[token]` - Accept/reject follow requests from email links
- `/settings` - Follow management UI (send requests, view connections)

**Email Service (Resend):**
- Configure `RESEND_API_KEY` for production email delivery
- Without API key, emails are logged to console (development mode)
- Email templates in `lib/email.ts`

### Environment Variables
Required:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Auth.js secret
- `AUTH_GOOGLE_ID` - Google OAuth client ID
- `AUTH_GOOGLE_SECRET` - Google OAuth client secret
- `GCS_BUCKET_NAME` - Google Cloud Storage bucket

Optional:
- `RESEND_API_KEY` - Resend API key for email delivery
- `EMAIL_FROM` - From address for emails (default: "Palm <noreply@palm.example.com>")
- `NEXT_PUBLIC_APP_URL` - App URL for email links
- `AUTH_URL` - Auth.js callback URL
- `GCP_SERVICE_ACCOUNT_KEY` - GCS service account (uses ADC if not set)

### Reference Projects
When implementing new features, reference these existing codebases for patterns:
- `good-head`: Docker Compose, Prisma schema patterns
- `dock-dev-submodule`: Auth.js, GCS, middleware, REST API patterns

---
