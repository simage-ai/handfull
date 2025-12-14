# Create PRP

## Feature file: $ARGUMENTS

Generate a complete PRP for **Next.js** feature implementation with thorough research. Ensure context is passed to the AI agent to enable self-validation and iterative refinement. Read the feature file first to understand what needs to be created, how the examples provided help, and any other considerations.

The AI agent only gets the context you append to the PRP and its training data. Assume the AI agent has access to the codebase and the same knowledge cutoff as you, so it’s important that your research findings are included or referenced in the PRP. The Agent has Web search capabilities, so pass URLs to documentation and examples.

---

## Research Process

1. **Codebase Analysis (Next.js-specific)**
   - **Routing & Layouts**: Map the `app/` tree (segment hierarchy, `layout.tsx`, `template.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`) and any Route Handlers under `app/**/route.ts`.
   - **Server vs Client Components**: Identify components that must be interactive and confirm `"use client"` boundaries. Prefer RSC for data fetching and composition.
   - **Data Access**: Locate data utilities in `lib/` (e.g., fetch helpers, server actions), Prisma clients, or external SDK usage. Note cache policy (`cache: "force-cache" | "no-store"`, `revalidate`).
   - **Runtimes**: Check `export const runtime = "edge" | "nodejs"` where applicable; record constraints (e.g., Edge runtime disallows certain Node APIs).
   - **Configs & Conventions**: `package.json` scripts, `next.config.*`, `tsconfig.*`, `eslint`/`prettier` setup, `tailwind.config.*`, `postcss.config.*`, `.env.example`.
   - **Design System**: Tailwind patterns, tokens, global styles, and whether **shadcn/ui** is installed (registry files, `components/ui`).
   - **Auth/Middleware**: `middleware.ts` for auth/locale; how session state is handled (cookies, headers). Record protected routes and required roles.
   - **Testing**: Determine test stack (`vitest` or `jest`, `@testing-library/react`, `playwright`/`cypress`), directory conventions, and helpers.
   - **Observability**: Note analytics (Vercel/GA/Segment), logging, feature flags, and error reporting (Sentry, etc.).

2. **External Research**
   - **Documentation (include specific URLs/anchors)**:
     - Next.js App Router (routing, RSC, data fetching, caching/ISR, Route Handlers, `generateMetadata`, `next/image`, `next/font`, Middleware).
     - React docs (RSC model, Suspense, server actions if applicable).
     - Tailwind CSS & **shadcn/ui** component docs/examples.
     - Testing stack (Vitest/Jest + Testing Library; Playwright/Cypress).
     - Accessibility (WCAG 2.1 AA, WAI-ARIA Authoring Practices).
   - **Implementation Examples**: GitHub repos, blog posts, StackOverflow answers that match the patterns you’ll use (SSR/ISR, mutations via server actions, auth+middleware, streaming UI).
   - **Best Practices & Pitfalls**: Common issues with caching boundaries, stale data after mutations, client bundle bloat, improper `use client`, over-eager revalidation, missing a11y roles, and SEO metadata gaps.

3. **User Clarification (if needed)**
   - Required auth/roles and how they map to routes.
   - Expected data latency and desired freshness (SSR vs ISR vs static).
   - Target devices/performance budgets and a11y requirements.
   - Preferred testing coverage (unit/integration/e2e) thresholds.

---

## PRP Generation

Using `PRPs/templates/prp_base.md` as template:

### Critical Context to Include and pass to the AI agent as part of the PRP
- **Documentation**: Direct URLs with precise sections/anchors relevant to:
  - App Router routing & nested layouts
  - RSC vs Client Components guidance
  - Data fetching & caching (`fetch` options, `revalidate`, ISR)
  - Route Handlers & server actions (if used)
  - `generateMetadata` / SEO / social tags
  - Middleware (auth/locale) and headers
  - `next/image` best practices; static assets under `public/`
  - Tailwind & shadcn/ui component references used in this feature
  - Testing stack usage notes (Testing Library patterns, Playwright best practices)
- **Code Examples**: Real snippets from the repo that mirror target patterns:
  - Example route segments, layout composition, and loading states
  - Existing form/interaction components with `"use client"`
  - A working Route Handler performing validation and returning JSON
  - Reusable UI primitives from `components/ui` (buttons, dialogs, forms)
- **Gotchas**:
  - RSC boundaries (do not import server-only code into client components)
  - Edge runtime constraints (no Node APIs, crypto subtle differences)
  - Cache invalidation and revalidation timing after mutations
  - `next/navigation` vs `next/router` in App Router
  - `next/image` domain allowlist and unoptimized behavior locally
  - Shadcn form field a11y (labels, descriptions, error regions)
- **Patterns**:
  - Server actions or Route Handlers for mutations (Zod validation)
  - Suspense for streaming data; `loading.tsx` for skeletons
  - Error boundaries via `error.tsx` and typed errors
  - Co-located tests and story/docs (if Storybook present)

### Implementation Blueprint
- Start with pseudocode showing the end-to-end flow:
  - **Routing**: Define target segment path(s) under `app/feature/...`
  - **Data**: Read path/query params; call server utilities; set cache and revalidation policies
  - **UI**: Compose RSC parent with client islands; specify shadcn components
  - **Actions**: Validate input (Zod) in server action/Route Handler; handle errors; trigger revalidate where needed
  - **SEO**: Provide `generateMetadata` including `og:` and `twitter:` tags
  - **A11y/UX**: Keyboard navigation, focus trap on dialogs, ARIA roles/labels, error region announcements
- Reference real files for patterns (paths and function names).
- Include error handling strategy (typed errors, `notFound()`, `redirect()` usage).
- **List tasks** to complete the PRP in order (scaffold routes → server logic → UI → tests → docs).

### Detailed Next.js Implementation Checklist
- **Routing & Files**
  - Create/modify: `app/(group)/feature/page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
  - Add `app/api/feature/route.ts` (if using Route Handler) or server actions in RSC
  - Update `middleware.ts` if auth/locale conditions apply
- **Components**
  - RSC container components; client islands with `"use client"`
  - Use shadcn/ui primitives (e.g., `Button`, `Input`, `Dialog`, `Form`, `Toaster`)
  - Ensure Tailwind classes follow project conventions; include dark-mode variants if supported
- **Data & Validation**
  - Centralize schema with **Zod**
  - On mutation success, `revalidatePath()`/`revalidateTag()` as needed
  - Handle optimistic UI or pending states with `useTransition` in client components
- **SEO & Metadata**
  - Implement `export const metadata = {}` or `export async function generateMetadata(){}`
  - Add canonical URL, title/description, OG image, and robots hints
- **Accessibility**
  - Label inputs; provide `aria-describedby` for errors
  - Manage focus on route transitions/modals; escape key handling
  - Color contrast; prefers-reduced-motion considerations
- **Performance**
  - Prefer RSC data fetching; lazy-load heavy client components
  - Use `next/image` with appropriate `sizes` and `priority`
  - Avoid large client dependencies; tree-shakeable imports only
- **Security**
  - Validate all inputs server-side (Zod); sanitize user content
  - Use HTTP-only cookies for session; `sameSite` as required
  - Avoid leaking secrets to client; keep tokens server-only
- **Internationalization (if applicable)**
  - Locale routing via middleware; load dictionaries server-side
  - Ensure date/number formatting is locale-aware

---

### Validation Gates (Must be Executable) eg for Next.js

> Use the project’s existing package manager and scripts. If a script is missing, propose adding it in `package.json` and include the exact diff.

```bash
# Install deps (adjust to your PM: npm/yarn/pnpm)
pnpm install

# Types & Lint
pnpm run typecheck      # e.g., "tsc -p tsconfig.json --noEmit"
pnpm run lint           # e.g., "eslint ."

# Unit & Integration
pnpm run test           # vitest or jest; ensure jsdom where needed

# E2E (if Playwright exists)
pnpm exec playwright install
pnpm run e2e            # headless e2e flows for happy-path + one failure-path

# Build (must succeed)
pnpm run build          # next build

# Optional: a11y smoke (CI)
# - If using jest-axe/axe-playwright, add a minimal rule check for key pages
```

- Lighthouse/Web Vitals checklist (document findings or target thresholds):

   - LCP < 2.5s (mobile), CLS < 0.1, INP < 200ms, TTFB < 0.8s

   - Image sizing (sizes), font loading (display: swap), script strategy (lazyOnload where safe)

   - Avoid render-blocking CSS/JS beyond Tailwind base

**IMPORTANT:** Sometimes you might call a package (e.g., eslint, vitest, playwright) that a user hasn’t installed—ask if you can add it and explain why. Propose package.json script additions and minimal config files (e.g., vitest.config.ts, .eslintrc.cjs) if missing.

*** CRITICAL AFTER YOU ARE DONE RESEARCHING AND EXPLORING THE CODEBASE BEFORE YOU START WRITING THE PRP ***

*** ULTRATHINK ABOUT THE PRP AND PLAN YOUR APPROACH THEN START WRITING THE PRP ***

## Output
Save as: `PRPs/{feature-name}.md`

## Quality Checklist
   - [ ] All necessary Next.js context included (routing, RSC/client boundaries, caching)
   - [ ] Validation gates are executable by AI and match repo scripts
   - [ ] References to existing patterns (files, components, utilities)
   - [ ]Clear implementation path with explicit file changes and error handling
   - [ ] a11y requirements documented and testable
   - [ ] Performance targets and SEO/metadata defined
   - [ ] Rollout/observability and rollback plan included

**Score the PRP on a scale of 1–10** (confidence level to succeed in one-pass implementation using the target AI coding assistant).