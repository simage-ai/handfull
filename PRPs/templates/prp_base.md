# Base PRP Template v2 - Context-Rich with Validation Loops (Next.js Edition)

## Purpose
Template optimized for AI agents to implement **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** features with enough context and self-validation capabilities to achieve working code through iterative refinement.

## Core Principles
1. **Context is King**: Include ALL necessary Next.js docs, in-repo patterns, and caveats (RSC vs client components, data fetching, caching/ISR, middleware/auth).
2. **Validation Loops**: Provide executable scripts (typecheck, lint, tests, build, e2e/a11y) the AI can run and fix.
3. **Information Dense**: Use real file paths, export names, and patterns from the codebase.
4. **Progressive Success**: Ship a minimal vertical slice (route + UI + data) → validate → expand.
5. **Global rules**: Be sure to follow all rules in **CLAUDE.md**.

---

## Goal
[What needs to be built—be precise about the route(s), UI, data flow, and end-user behavior. Include the intended App Router segment(s) and whether the feature affects middleware/auth.]

## Why
- [Business value and user impact]
- [Integration with existing areas (navigation, shared components, route handlers, server actions)]
- [Problems this solves and for whom]

## What
[User-visible behavior and technical requirements: routing, data fetching strategy (SSR/ISR/Static), mutations (server actions vs route handlers), SEO metadata, a11y, performance targets.]

### Success Criteria
- [ ] Pages render with no runtime errors in **Node** (and **Edge** if applicable).
- [ ] TypeScript passes with `--noEmit`.
- [ ] Lint passes with repo rules.
- [ ] Unit/integration tests pass; e2e happy path passes.
- [ ] CLS < 0.1, LCP < 2.5s (mobile), INP < 200ms on target pages (baseline).
- [ ] a11y checks pass (labels, roles, keyboard nav, focus management).
- [ ] Build succeeds and artifacts deploy without warnings that indicate broken behavior.

## All Needed Context

### Documentation & References (list all context needed to implement the feature)
```yaml
# MUST READ - Include these in your context window
- url: https://nextjs.org/docs/app/building-your-application/routing
  why: App Router segment structure (layouts, pages, loading, error), nested routes.

- url: https://nextjs.org/docs/app/building-your-application/data-fetching/fetching
  why: Server-side data fetching patterns, caching, revalidate, tags.

- url: https://nextjs.org/docs/app/building-your-application/caching
  why: Cache semantics, ISR (`revalidate`), `no-store`, `revalidateTag/revalidatePath`.

- url: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
  why: `generateMetadata`, SEO and social tags.

- url: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
  why: Server-only APIs via `app/**/route.ts`, request/response patterns.

- url: https://ui.shadcn.com/
  why: UI primitives; accessibility patterns for forms, dialogs, toasts.

- url: https://tailwindcss.com/docs
  why: Styling conventions; responsive/sizing; dark mode patterns.

- url: https://testing-library.com/docs/react-testing-library/intro/
  why: Component testing idioms; queries and a11y-first testing.

- url: https://playwright.dev/docs/intro
  why: E2E flows; auth/session handling; tracing.

- file: lib/** (e.g., db.ts, auth.ts, fetchers.ts)
  why: Reuse data access, typed env, and auth helpers.

- file: middleware.ts
  why: Understand auth/locale/rewrites affecting new routes.
```

## Current Codebase tree (run tree in the root of the project) to get an overview of the codebase
```bash
# Paste the output of `tree -L 3` (or equivalent) here to ground path references.
```
## Desired Codebase tree with files to be added and responsibility of file

```
# Show only the diffs you plan to introduce (paths under app/, components/, lib/, tests/).
# Example:
app/
  (dashboard)/
    reports/
      page.tsx               # RSC entry: fetch & render report list
      loading.tsx            # route-level skeleton
      error.tsx              # route-level error boundary
app/api/reports/route.ts     # Route Handler for CRUD (server-only)
components/reports/
  ReportList.tsx             # "use client" for interactions (sort/filter)
  ReportCard.tsx             # presentational
lib/
  reports.ts                 # server utilities; Zod validate; fetch & cache tags
tests/
  unit/
    lib.reports.test.ts
  integration/
    app.dashboard.reports.test.tsx
  e2e/
    reports.spec.ts          # Playwright happy path & one failure case
```
## Known Gotchas of our codebase & Library Quirks
```
// CRITICAL: Keep server-only code (DB, secrets) out of client components.
// GOTCHA: Edge runtime cannot use certain Node APIs (e.g., native crypto differences).
// GOTCHA: Revalidate after mutations. Use revalidatePath('/route') or revalidateTag('key').
// GOTCHA: Do not import "next/navigation" hooks in RSC (server) files.
// GOTCHA: next/image requires domain allowlist in next.config.* for remote images.
// GOTCHA: Use "use client" only where interactivity is needed; keep client bundle small.
// PATTERN: All inputs validated with Zod in server actions / route handlers.
// PATTERN: a11y: Label form fields, manage focus on dialogs, and ensure keyboard nav.
```

# Implementation Blueprint

## UI & Types (replace with what’s relevant)

Define page-level RSC (server) composition and client islands. Keep client modules minimal.

```tsx
// app/(dashboard)/reports/page.tsx (RSC)
import { getReports } from "@/lib/reports";
export default async function Page() {
  const reports = await getReports();
  return <section><h1 className="text-2xl">Reports</h1>
    {/* Client island for controls */}
    {/* <ReportList reports={reports} /> */}
  </section>;
}

// components/reports/ReportList.tsx (Client)
"use client";
import { useState, useTransition } from "react";
// ...sort/filter UI with shadcn/ui primitives
```

Define server utilities with validation and caching semantics.

```tsx
// lib/reports.ts
import { z } from "zod";
export const ReportSchema = z.object({ id: z.string(), title: z.string() });

export async function getReports() {
  // cache semantics (adjust per feature): force-cache | no-store | revalidate seconds
  const res = await fetch(process.env.API_URL + "/reports", { next: { revalidate: 60 } });
  const data = await res.json();
  return ReportSchema.array().parse(data);
}
```

### List of tasks to be completed to fulfill the PRP in the order they should be completed

```yaml
Task 1:
CREATE app/(dashboard)/reports/page.tsx:
  - RSC entry; fetch data via lib/reports.ts
  - Provide loading.tsx and error.tsx in same segment

Task 2:
CREATE lib/reports.ts:
  - Implement typed fetchers with Zod validation
  - Decide cache policy (revalidate seconds or tags)

Task 3:
CREATE components/reports/ReportList.tsx:
  - "use client"; interactive controls (filter/sort); shadcn/ui components
  - Ensure keyboard navigation and focus management

Task 4:
CREATE app/api/reports/route.ts:
  - Route Handler for fetch/create (if needed)
  - Validate input with Zod; return typed JSON

Task 5:
UPDATE middleware.ts (if applicable):
  - Protect routes under (dashboard); redirect unauthenticated users

Task 6:
TESTS:
  - Unit: lib/reports.test.ts (schema validation, error cases)
  - Integration: render page and verify data appears
  - E2E: Playwright spec exercising happy path and failure path

Task 7:
SEO & Analytics:
  - Add generateMetadata to page; add OG tags
  - Add basic page view metric hook (if project uses analytics)

Task 8:
Docs & Scripts:
  - Document env vars in .env.example
  - Ensure package.json has scripts: typecheck, lint, test, e2e, build
```

### Per task pseudocode as needed added to each task

```ts
// Task 4 pseudocode: Route Handler (app/api/reports/route.ts)
import { z } from "zod";
const CreateSchema = z.object({ title: z.string().min(1) });

export async function GET() {
  // fetch from data source (server-only)
  // return new Response(JSON.stringify(items), { headers: { "Content-Type": "application/json" } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
  }
  // persist to DB/external API
  // revalidateTag('reports') or revalidatePath('/dashboard/reports');
  // return new Response(JSON.stringify({ ok: true }), { status: 201 });
}
```

### Integration Points

```yaml
AUTH/MIDDLEWARE:
  - middleware.ts: Protect dashboard segments; locale detection if applicable.

CONFIG:
  - next.config.*: image domains, experimental flags (if any).
  - env: Add API_URL (document in .env.example) and typed accessor in lib/config.ts.

DATA:
  - If DB involved, ensure server-only access in lib/**; never import into client modules.
  - Revalidation strategy: use tags for list/detail consistency.

SEO:
  - `generateMetadata` for route; canonical, description, OG/Twitter tags.

OBSERVABILITY:
  - Add minimal logging in route handlers + server actions.
  - Add metrics hook if the project standard exists.
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
pnpm run typecheck     # e.g., "tsc --noEmit"
pnpm run lint          # e.g., "eslint ."

# Expected: No errors. If errors, READ and fix. If really weird errors that you can't fix, remember move on and then report back when all is complete.
```

### Level 2: Unit & Integration Tests

```bash
# Unit (Vitest/Jest)
pnpm run test -w

# Example test hints:
# - lib/reports.test.ts validates Zod schema failures on malformed data
# - component tests assert accessible names/roles and keyboard interaction
```

```ts
// Example: lib/reports.test.ts
import { expect, test } from "vitest";
import { ReportSchema } from "@/lib/reports";

test("invalid report throws", () => {
  expect(() => ReportSchema.parse({ id: 1, title: null })).toThrow();
});
```

### Level 3: E2E & Build

```bash
# E2E: Playwright
pnpm exec playwright install
pnpm run e2e

# Build (must succeed)
pnpm run build
```

If failing: read the stack trace, check server/client boundaries, caching settings, and missing env vars. Fix and re-run—do not “mock to pass” unless that mirrors actual runtime constraints. Also, sometimes the user might tell you to skip running tests, if they do, you don't have to run them.

### Final Validation Checklist
- [ ] All tests pass: pnpm test (and pnpm e2e if present)
- [ ] No linting errors: pnpm lint
- [ ] No type errors: pnpm typecheck
- [ ] Manual smoke: feature routes render and behave as specified
- [ ] a11y smoke: forms labeled, dialogs focus-trap, keyboard navigation works
- [ ] Build succeeds: pnpm build
- [ ] Docs updated: .env.example, README/route docs if needed

### Anti-Patterns to Avoid
- ❌ Importing server-only modules (DB, secrets) into client components.
- ❌ Using useRouter/useSearchParams in RSC files.
- ❌ Skipping Zod validation at server boundaries (server actions/route handlers).
- ❌ Relying on client-only state for data that should be fetched server-side.
- ❌ Shipping large client bundles (avoid heavy libs; lazy-load islands).
- ❌ Ignoring revalidation after mutations (stale UI).
- ❌ Missing a11y (no labels/roles, broken keyboard/focus).
- ❌ Adding new patterns when established ones exist in the repo.