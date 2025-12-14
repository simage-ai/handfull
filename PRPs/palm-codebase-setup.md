# PRP: Palm Meal Tracking Application - Full Codebase Setup

## Purpose
Comprehensive implementation plan for Palm, a meal/macro tracking application with photo logging capabilities. This PRP covers backend infrastructure, database schema, authentication, GCS integration, REST API, and full UI implementation following the user's preferred patterns from reference projects.

## Core Principles
1. **Context is King**: All patterns derived from user's existing projects (good-head, dock-dev-submodule)
2. **Validation Loops**: Executable scripts for typecheck, lint, tests, and build
3. **Information Dense**: Real file paths, export names, and patterns from the codebase
4. **Progressive Success**: Backend → Schema → Auth → API → UI → Tests
5. **Global rules**: Follow all rules in **CLAUDE.md**

---

## Goal
Build a complete meal/macro tracking web application that allows users to:
- Log meals with macro counts (proteins, fats, carbs, veggies, junk) and optional photos
- Create/manage nutrition plans with slot allocations
- View progress via dashboard with radial charts showing daily slot usage
- Share meal logs with trainers via public shareable links (no auth required for viewers)

The app will use Next.js App Router with:
- PostgreSQL database (Prisma ORM)
- Google Cloud Storage for meal images
- Google OAuth authentication (Auth.js)
- REST API for CRUD operations (compatible with future iOS app)
- shadcn/ui components throughout

---

## Why
- **Business value**: Personal health tracking with trainer visibility
- **iOS compatibility**: REST API design allows future mobile app integration
- **User experience**: Simple meal logging with visual macro tracking via radial charts
- **Sharing**: Trainers can view client progress without needing accounts

---

## What

### Success Criteria
- [ ] Local backend (PostgreSQL) running via Docker Compose
- [ ] Prisma schema with User, Meal, Plan, Note models
- [ ] Google OAuth authentication working
- [ ] GCS integration for image uploads
- [ ] REST API endpoints for meals and plans CRUD
- [ ] Dashboard with sidebar navigation (home, meals, plans, settings)
- [ ] Radial chart showing daily macro slot usage
- [ ] Data table for meal management
- [ ] Add meal page with form and image upload
- [ ] Public share page at `/share/[userId]`
- [ ] TypeScript passes with `--noEmit`
- [ ] Lint passes with repo rules
- [ ] Build succeeds without errors

---

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window

# Next.js App Router
- url: https://nextjs.org/docs/app/building-your-application/routing
  why: App Router segment structure (layouts, pages, loading, error), nested routes

- url: https://nextjs.org/docs/app/building-your-application/data-fetching/fetching
  why: Server-side data fetching patterns, caching, revalidate, tags

- url: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
  why: Server-only APIs via `app/**/route.ts`, request/response patterns

# Prisma ORM
- url: https://www.prisma.io/docs/concepts/components/prisma-schema/data-model
  why: Schema definition, relations, field types, attributes

- url: https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate
  why: Migration workflow, dev vs deploy

# Auth.js (NextAuth v5)
- url: https://authjs.dev/getting-started/installation?framework=next.js
  why: Next.js App Router setup, Google provider, callbacks

- url: https://authjs.dev/getting-started/providers/google
  why: Google OAuth configuration, callback URLs

# shadcn/ui Components
- url: https://ui.shadcn.com/charts/radial
  why: Radial chart for macro slot visualization

- url: https://ui.shadcn.com/docs/components/data-table
  why: TanStack Table integration for meals list

- url: https://ui.shadcn.com/docs/components/sidebar
  why: Dashboard sidebar navigation

- url: https://ui.shadcn.com/docs/components/form
  why: Form components with zod validation

# Google Cloud Storage
- url: https://cloud.google.com/storage/docs/uploading-objects#storage-upload-object-nodejs
  why: Node.js SDK for image uploads

# Reference Files (User's Existing Patterns)
- file: /Users/cyakaboski/src/simage/good-head/backend/docker-compose.yml
  why: Docker Compose pattern for local PostgreSQL

- file: /Users/cyakaboski/src/simage/dock-dev-submodule/dev/trees/frontend-1/src/frontend/lib/auth.ts
  why: Auth.js configuration with Google OAuth

- file: /Users/cyakaboski/src/simage/dock-dev-submodule/dev/trees/frontend-1/src/frontend/lib/gcs.ts
  why: GCS integration pattern

- file: /Users/cyakaboski/src/simage/dock-dev-submodule/dev/trees/frontend-1/src/frontend/middleware.ts
  why: Route protection middleware pattern

- file: /Users/cyakaboski/src/simage/dock-dev-submodule/dev/trees/frontend-1/src/frontend/app/api/rest/v1/dock/models/route.ts
  why: REST API route handler pattern with auth and validation
```

---

## Current Codebase Tree

```
palm/
├── backend/                    # Empty - to be setup
├── frontend/
│   ├── mobile/
│   │   └── ios/               # Future iOS app
│   └── web/                   # Next.js application
│       ├── app/
│       │   ├── favicon.ico
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── cors/
│       │   ├── cors.json
│       │   └── gcp-cors-config.json
│       ├── eslint.config.mjs
│       ├── next-env.d.ts
│       ├── next.config.ts
│       ├── package.json
│       ├── pnpm-lock.yaml
│       ├── postcss.config.mjs
│       ├── public/
│       ├── README.md
│       └── tsconfig.json
├── CLAUDE.md
├── INITIAL.md
├── PRPs/
└── README.md
```

---

## Desired Codebase Tree with Files to be Added

```
palm/
├── backend/
│   ├── docker-compose.yml          # PostgreSQL + pgAdmin for local dev
│   ├── docker/
│   │   └── postgres/
│   │       └── init/
│   │           └── 01-init.sql     # Initial DB setup
│   ├── .env.example                # Backend env template
│   └── README.md                   # Backend setup instructions
│
├── frontend/web/
│   ├── .env.local                  # Local environment variables (gitignored)
│   ├── .env.example                # Environment template for developers
│   │
│   ├── prisma/
│   │   └── schema.prisma           # Database schema: User, Meal, Plan, Note
│   │
│   ├── lib/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── gcs.ts                  # Google Cloud Storage utilities
│   │   ├── auth.ts                 # Auth.js configuration (Google OAuth)
│   │   ├── config.ts               # Typed environment variable access
│   │   └── utils.ts                # General utilities (cn, etc.)
│   │
│   ├── middleware.ts               # Route protection for /dashboard/*
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives (installed via CLI)
│   │   ├── common/
│   │   │   ├── providers.tsx       # SessionProvider wrapper
│   │   │   └── user-nav.tsx        # User dropdown in header
│   │   └── domain/
│   │       ├── dashboard/
│   │       │   ├── app-sidebar.tsx       # Dashboard sidebar navigation
│   │       │   ├── macro-radial-chart.tsx # Radial chart for daily macros
│   │       │   └── weekly-trend.tsx      # Weekly trend visualization
│   │       ├── meals/
│   │       │   ├── meal-form.tsx         # Add/edit meal form
│   │       │   ├── meals-table.tsx       # DataTable for meals CRUD
│   │       │   ├── meal-columns.tsx      # Column definitions
│   │       │   └── meal-image-upload.tsx # Image upload component
│   │       ├── plans/
│   │       │   ├── plan-form.tsx         # Create/edit plan form
│   │       │   ├── plans-list.tsx        # Plans display with active indicator
│   │       │   └── plan-card.tsx         # Individual plan card
│   │       └── share/
│   │           ├── meal-gallery.tsx      # Gallery view for shared page
│   │           └── meal-detail-dialog.tsx # Meal detail modal
│   │
│   ├── app/
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Landing page / redirect to dashboard
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts    # Auth.js route handler
│   │   │   └── rest/
│   │   │       └── v1/
│   │   │           ├── meals/
│   │   │           │   └── route.ts      # GET (list), POST (create)
│   │   │           ├── meals/
│   │   │           │   └── [id]/
│   │   │           │       └── route.ts  # GET, PUT, DELETE single meal
│   │   │           ├── plans/
│   │   │           │   └── route.ts      # GET (list), POST (create)
│   │   │           ├── plans/
│   │   │           │   └── [id]/
│   │   │           │       └── route.ts  # GET, PUT, DELETE single plan
│   │   │           ├── plans/
│   │   │           │   └── [id]/
│   │   │           │       └── activate/
│   │   │           │           └── route.ts  # POST - set active plan
│   │   │           ├── users/
│   │   │           │   └── me/
│   │   │           │       └── route.ts  # GET/PUT current user
│   │   │           └── upload/
│   │   │               └── route.ts      # POST - image upload to GCS
│   │   │
│   │   ├── (auth)/
│   │   │   ├── signin/
│   │   │   │   └── page.tsx        # Custom sign-in page
│   │   │   └── error/
│   │   │       └── page.tsx        # Auth error page
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx        # Home tab - radial chart, quick add, trends
│   │   │   │   └── loading.tsx     # Loading skeleton
│   │   │   ├── meals/
│   │   │   │   ├── page.tsx        # Meals tab - data table
│   │   │   │   └── loading.tsx
│   │   │   ├── plans/
│   │   │   │   ├── page.tsx        # Plans tab - plan management
│   │   │   │   └── loading.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx        # User settings, share link generation
│   │   │       └── loading.tsx
│   │   │
│   │   ├── add-meal/
│   │   │   ├── page.tsx            # Add meal form page
│   │   │   └── loading.tsx
│   │   │
│   │   └── share/
│   │       └── [userId]/
│   │           ├── page.tsx        # Public gallery view (no auth)
│   │           └── loading.tsx
│   │
│   ├── types/
│   │   ├── next-auth.d.ts          # Auth.js type extensions
│   │   └── index.ts                # Shared types
│   │
│   └── tests/                      # Test files (if time permits)
│       ├── unit/
│       └── integration/
```

---

## Known Gotchas & Library Quirks

```typescript
// CRITICAL: Keep server-only code (DB, secrets) out of client components
// - Prisma client must only be imported in server components/actions/route handlers
// - GCS operations are server-only

// GOTCHA: Auth.js v5 uses different import paths than v4
// - Use "next-auth" not "next-auth/react" for server imports
// - The auth() function works in both server components and route handlers

// GOTCHA: Middleware runs on Edge runtime
// - Cannot use Prisma directly in middleware
// - Use auth() from "@/lib/auth" which handles JWT session

// GOTCHA: next/image requires domain allowlist for GCS images
// - Add storage.googleapis.com to next.config.ts images.remotePatterns

// GOTCHA: Radial charts in shadcn use Recharts
// - RadialBarChart component from recharts
// - Requires specific data format with "fill" property

// PATTERN: All inputs validated with Zod in route handlers
// - Never trust client input, always validate server-side

// PATTERN: Use revalidatePath() after mutations
// - Call after successful CRUD operations to refresh cached data

// PATTERN: Share page is public (no auth)
// - Use dynamic route /share/[userId] without middleware protection
// - Validate userId exists, return 404 if not found

// PATTERN: Image uploads go to GCS, store path in DB
// - Frontend: FormData with file
// - Backend: Upload to GCS, return gs:// path
// - DB: Store gs:// path in Meal.image field
```

---

# Implementation Blueprint

## Phase 1: Backend Infrastructure

### Task 1: Create Docker Compose for Local PostgreSQL

**File:** `backend/docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16
    container_name: palm_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-palm_db}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-palm_db}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - palm_network

  # pgAdmin for database management (dev only)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: palm_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL:-admin@palm.local}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD:-changeme}
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "${PGADMIN_PORT:-5050}:80"
    depends_on:
      - postgres
    networks:
      - palm_network
    profiles:
      - dev

volumes:
  postgres_data:
    driver: local

networks:
  palm_network:
    driver: bridge
```

**File:** `backend/.env.example`

```bash
# PostgreSQL Configuration
POSTGRES_DB=palm_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changeme_postgres_password
POSTGRES_PORT=5432

# pgAdmin (Development Only)
PGADMIN_EMAIL=admin@palm.local
PGADMIN_PASSWORD=changeme_pgadmin_password
PGADMIN_PORT=5050

# Connection string for frontend
DATABASE_URL=postgresql://postgres:changeme_postgres_password@localhost:5432/palm_db
```

---

### Task 2: Create Frontend Environment Configuration

**File:** `frontend/web/.env.example`

```bash
# Database (Prisma)
DATABASE_URL="postgresql://postgres:changeme_postgres_password@localhost:5432/palm_db"

# Auth.js
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
AUTH_URL="http://localhost:3000"

# Google Cloud Storage
GCS_BUCKET_NAME="palm-meal-images"
GCP_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
# OR use Application Default Credentials locally

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

### Task 3: Create lib/config.ts for Typed Environment Access

**File:** `frontend/web/lib/config.ts`

```typescript
/**
 * Typed environment variable access
 * Centralizes all env var access with validation
 */

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || "";
}

export const config = {
  // Database
  databaseUrl: () => getEnvVar("DATABASE_URL"),

  // Auth
  authSecret: () => getEnvVar("AUTH_SECRET"),
  authGoogleId: () => getEnvVar("AUTH_GOOGLE_ID"),
  authGoogleSecret: () => getEnvVar("AUTH_GOOGLE_SECRET"),
  authUrl: () => getEnvVar("AUTH_URL", false) || "http://localhost:3000",

  // GCS
  gcsBucketName: () => getEnvVar("GCS_BUCKET_NAME"),
  gcpServiceAccountKey: () => getEnvVar("GCP_SERVICE_ACCOUNT_KEY", false),

  // App
  appUrl: () => getEnvVar("NEXT_PUBLIC_APP_URL", false) || "http://localhost:3000",
} as const;
```

---

## Phase 2: Database Schema

### Task 4: Create Prisma Schema

**File:** `frontend/web/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  firstName String   @map("first_name")
  lastName  String   @map("last_name")
  image     String?  // Profile image URL from OAuth

  // Relations
  meals     Meal[]
  plans     Plan[]

  // Active plan reference
  activePlanId String? @map("active_plan_id")
  activePlan   Plan?   @relation("ActivePlan", fields: [activePlanId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Meal {
  id           String        @id @default(uuid())

  // Macro slots used
  proteinsUsed Int           @default(0) @map("proteins_used")
  fatsUsed     Int           @default(0) @map("fats_used")
  carbsUsed    Int           @default(0) @map("carbs_used")
  veggiesUsed  Int           @default(0) @map("veggies_used")
  junkUsed     Int           @default(0) @map("junk_used")

  // Optional fields
  image        String?       // GCS path (gs://bucket/path)
  mealCategory MealCategory?

  // Timestamp for when meal was consumed
  dateTime     DateTime      @default(now()) @map("date_time")

  // Relations
  userId       String        @map("user_id")
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  notes        Note[]

  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  @@index([userId, dateTime])
  @@map("meals")
}

model Plan {
  id           String   @id @default(uuid())
  name         String

  // Daily slot allocations
  proteinSlots Int      @default(0) @map("protein_slots")
  fatSlots     Int      @default(0) @map("fat_slots")
  carbSlots    Int      @default(0) @map("carb_slots")
  veggieSlots  Int      @default(0) @map("veggie_slots")
  junkSlots    Int      @default(0) @map("junk_slots")

  // Relations
  userId       String   @map("user_id")
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Users who have this as active plan (inverse relation)
  activeForUsers User[] @relation("ActivePlan")

  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("plans")
}

model Note {
  id        String   @id @default(uuid())
  text      String   @db.Text

  // Relations
  mealId    String   @map("meal_id")
  meal      Meal     @relation(fields: [mealId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now()) @map("created_at")

  @@map("notes")
}

enum MealCategory {
  BREAKFAST
  LUNCH
  DINNER
  SNACK
}
```

---

### Task 5: Create Prisma Client Singleton

**File:** `frontend/web/lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## Phase 3: Authentication

### Task 6: Create Auth.js Configuration

**File:** `frontend/web/lib/auth.ts`

```typescript
/**
 * Auth.js (NextAuth v5) configuration with Google OAuth
 */
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const processName = (name: string | null | undefined) => {
  if (!name) return { firstName: "", lastName: "" };
  const parts = name.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      // Upsert user in database on sign in
      const { firstName, lastName } = processName(user.name);

      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          firstName,
          lastName,
          image: user.image,
        },
        create: {
          email: user.email,
          firstName,
          lastName,
          image: user.image,
        },
      });

      return true;
    },

    async jwt({ token, user, account, profile }) {
      if (account && profile) {
        const { firstName, lastName } = processName((profile as any).name);
        token.firstName = firstName;
        token.lastName = lastName;
        token.fullName = (profile as any).name || "";
      }

      // Fetch user ID from database
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.firstName = token.firstName as string;
      session.user.lastName = token.lastName as string;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/error",
  },
  debug: process.env.NODE_ENV === "development",
});
```

---

### Task 7: Create Auth Type Extensions

**File:** `frontend/web/types/next-auth.d.ts`

```typescript
import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName: string;
      lastName: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
  }
}
```

---

### Task 8: Create Auth Route Handler

**File:** `frontend/web/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

---

### Task 9: Create Middleware for Route Protection

**File:** `frontend/web/middleware.ts`

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes - no auth required
  const publicRoutes = ["/", "/signin", "/error", "/share"];
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith("/share/")
  );

  // API routes that are public
  const isPublicApi = pathname.startsWith("/api/auth");

  if (isPublicRoute || isPublicApi) {
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (!req.auth?.user) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

## Phase 4: GCS Integration

### Task 10: Create GCS Utilities

**File:** `frontend/web/lib/gcs.ts`

```typescript
import { Storage } from "@google-cloud/storage";

export const storage = new Storage(
  process.env.GCP_SERVICE_ACCOUNT_KEY
    ? {
        credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY),
      }
    : undefined // Falls back to GOOGLE_APPLICATION_CREDENTIALS or ambient creds
);

export const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);

/**
 * Upload a file to GCS and return the gs:// path
 */
export async function uploadMealImage(
  userId: string,
  mealId: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const extension = contentType.split("/")[1] || "jpg";
  const gcsPath = `meals/${userId}/${mealId}/${filename}.${extension}`;

  await bucket.file(gcsPath).save(file, {
    contentType,
    metadata: {
      userId,
      mealId,
    },
  });

  return `gs://${bucket.name}/${gcsPath}`;
}

/**
 * Generate a signed URL for viewing a meal image
 */
export async function getSignedImageUrl(gcsPath: string): Promise<string> {
  if (!gcsPath.startsWith("gs://")) {
    throw new Error("Invalid GCS path");
  }

  const filePath = gcsPath.replace(`gs://${bucket.name}/`, "");
  const [url] = await bucket.file(filePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  return url;
}

/**
 * Delete a meal image from GCS
 */
export async function deleteMealImage(gcsPath: string): Promise<void> {
  if (!gcsPath || !gcsPath.startsWith("gs://")) return;

  const filePath = gcsPath.replace(`gs://${bucket.name}/`, "");
  try {
    await bucket.file(filePath).delete();
  } catch (error) {
    console.error("Error deleting image:", error);
    // Don't throw - file might already be deleted
  }
}
```

---

## Phase 5: REST API Endpoints

### Task 11: Create Meals API Routes

**File:** `frontend/web/app/api/rest/v1/meals/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const CreateMealSchema = z.object({
  proteinsUsed: z.number().int().min(0).default(0),
  fatsUsed: z.number().int().min(0).default(0),
  carbsUsed: z.number().int().min(0).default(0),
  veggiesUsed: z.number().int().min(0).default(0),
  junkUsed: z.number().int().min(0).default(0),
  image: z.string().optional(),
  mealCategory: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]).optional(),
  dateTime: z.string().datetime().optional(),
  notes: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "25"), 100);
  const skip = (page - 1) * limit;

  // Date filtering
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const where: any = { userId: session.user.id };
  if (startDate || endDate) {
    where.dateTime = {};
    if (startDate) where.dateTime.gte = new Date(startDate);
    if (endDate) where.dateTime.lte = new Date(endDate);
  }

  const [meals, total] = await Promise.all([
    prisma.meal.findMany({
      where,
      include: { notes: true },
      orderBy: { dateTime: "desc" },
      skip,
      take: limit,
    }),
    prisma.meal.count({ where }),
  ]);

  return NextResponse.json({
    data: meals,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreateMealSchema.parse(body);

    const meal = await prisma.meal.create({
      data: {
        userId: session.user.id,
        proteinsUsed: validated.proteinsUsed,
        fatsUsed: validated.fatsUsed,
        carbsUsed: validated.carbsUsed,
        veggiesUsed: validated.veggiesUsed,
        junkUsed: validated.junkUsed,
        image: validated.image,
        mealCategory: validated.mealCategory,
        dateTime: validated.dateTime ? new Date(validated.dateTime) : new Date(),
        notes: validated.notes?.length
          ? {
              create: validated.notes.map((text) => ({ text })),
            }
          : undefined,
      },
      include: { notes: true },
    });

    revalidatePath("/dashboard");
    revalidatePath("/meals");

    return NextResponse.json({ data: meal }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create meal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**File:** `frontend/web/app/api/rest/v1/meals/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { deleteMealImage } from "@/lib/gcs";

const UpdateMealSchema = z.object({
  proteinsUsed: z.number().int().min(0).optional(),
  fatsUsed: z.number().int().min(0).optional(),
  carbsUsed: z.number().int().min(0).optional(),
  veggiesUsed: z.number().int().min(0).optional(),
  junkUsed: z.number().int().min(0).optional(),
  image: z.string().optional().nullable(),
  mealCategory: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]).optional().nullable(),
  dateTime: z.string().datetime().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const meal = await prisma.meal.findFirst({
    where: { id, userId: session.user.id },
    include: { notes: true },
  });

  if (!meal) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }

  return NextResponse.json({ data: meal });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const validated = UpdateMealSchema.parse(body);

    // Check meal exists and belongs to user
    const existing = await prisma.meal.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    const meal = await prisma.meal.update({
      where: { id },
      data: {
        ...validated,
        dateTime: validated.dateTime ? new Date(validated.dateTime) : undefined,
      },
      include: { notes: true },
    });

    revalidatePath("/dashboard");
    revalidatePath("/meals");

    return NextResponse.json({ data: meal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update meal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const meal = await prisma.meal.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!meal) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }

  // Delete image from GCS if exists
  if (meal.image) {
    await deleteMealImage(meal.image);
  }

  await prisma.meal.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/meals");

  return NextResponse.json({ success: true });
}
```

---

### Task 12: Create Plans API Routes

**File:** `frontend/web/app/api/rest/v1/plans/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const CreatePlanSchema = z.object({
  name: z.string().min(1).max(255),
  proteinSlots: z.number().int().min(0).default(0),
  fatSlots: z.number().int().min(0).default(0),
  carbSlots: z.number().int().min(0).default(0),
  veggieSlots: z.number().int().min(0).default(0),
  junkSlots: z.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.plan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  // Get active plan ID
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { activePlanId: true },
  });

  return NextResponse.json({
    data: plans,
    activePlanId: user?.activePlanId,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = CreatePlanSchema.parse(body);

    const plan = await prisma.plan.create({
      data: {
        ...validated,
        userId: session.user.id,
      },
    });

    revalidatePath("/plans");

    return NextResponse.json({ data: plan }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**File:** `frontend/web/app/api/rest/v1/plans/[id]/activate/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify plan belongs to user
  const plan = await prisma.plan.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Set as active plan
  await prisma.user.update({
    where: { id: session.user.id },
    data: { activePlanId: id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/plans");

  return NextResponse.json({ success: true, activePlanId: id });
}
```

---

### Task 13: Create Image Upload API

**File:** `frontend/web/app/api/rest/v1/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadMealImage } from "@/lib/gcs";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mealId = formData.get("mealId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, HEIC" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 10MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const effectiveMealId = mealId || randomUUID();

    const gcsPath = await uploadMealImage(
      session.user.id,
      effectiveMealId,
      buffer,
      file.type
    );

    return NextResponse.json({ data: { path: gcsPath } }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

---

## Phase 6: UI Components & Pages

### Task 14: Install shadcn/ui Components

Run these commands in `frontend/web/`:

```bash
# Initialize shadcn/ui
pnpm dlx shadcn@latest init

# Install required components
pnpm dlx shadcn@latest add button card dialog form input label
pnpm dlx shadcn@latest add select separator sheet sidebar skeleton
pnpm dlx shadcn@latest add table tabs textarea toast avatar badge
pnpm dlx shadcn@latest add dropdown-menu popover calendar chart

# Install additional dependencies
pnpm add @tanstack/react-table zod react-hook-form @hookform/resolvers
pnpm add lucide-react date-fns recharts
pnpm add @google-cloud/storage
```

---

### Task 15: Create Dashboard Layout with Sidebar

**File:** `frontend/web/app/(dashboard)/layout.tsx`

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/domain/dashboard/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { UserNav } from "@/components/common/user-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold">Palm</h1>
          </div>
          <UserNav user={session.user} />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

### Task 16: Create App Sidebar Component

**File:** `frontend/web/components/domain/dashboard/app-sidebar.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UtensilsCrossed,
  ClipboardList,
  Settings,
  PlusCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Meals", url: "/meals", icon: UtensilsCrossed },
  { title: "Plans", url: "/plans", icon: ClipboardList },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold">🌴 Palm</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button asChild className="w-full">
          <Link href="/add-meal">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Meal
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
```

---

### Task 17: Create Dashboard Home Page with Radial Chart

**File:** `frontend/web/app/(dashboard)/dashboard/page.tsx`

```tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { MacroRadialChart } from "@/components/domain/dashboard/macro-radial-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

async function getDashboardData(userId: string) {
  const today = new Date();

  // Get user with active plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { activePlan: true },
  });

  // Get today's meals
  const todayMeals = await prisma.meal.findMany({
    where: {
      userId,
      dateTime: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
    },
  });

  // Calculate used slots
  const usedSlots = todayMeals.reduce(
    (acc, meal) => ({
      proteins: acc.proteins + meal.proteinsUsed,
      fats: acc.fats + meal.fatsUsed,
      carbs: acc.carbs + meal.carbsUsed,
      veggies: acc.veggies + meal.veggiesUsed,
      junk: acc.junk + meal.junkUsed,
    }),
    { proteins: 0, fats: 0, carbs: 0, veggies: 0, junk: 0 }
  );

  return { user, usedSlots, todayMeals };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { user, usedSlots, todayMeals } = await getDashboardData(session.user.id);
  const plan = user?.activePlan;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {session.user.firstName || session.user.name}!
          </p>
        </div>
        <Button asChild>
          <Link href="/add-meal">
            <PlusCircle className="mr-2 h-4 w-4" />
            Quick Add Meal
          </Link>
        </Button>
      </div>

      {!plan ? (
        <Card>
          <CardHeader>
            <CardTitle>No Active Plan</CardTitle>
            <CardDescription>
              Create and activate a nutrition plan to start tracking your daily macros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/plans">Create Plan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full lg:col-span-2">
            <CardHeader>
              <CardTitle>Today&apos;s Progress</CardTitle>
              <CardDescription>
                Active Plan: {plan.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MacroRadialChart
                usedSlots={usedSlots}
                totalSlots={{
                  proteins: plan.proteinSlots,
                  fats: plan.fatSlots,
                  carbs: plan.carbSlots,
                  veggies: plan.veggieSlots,
                  junk: plan.junkSlots,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Meals</CardTitle>
              <CardDescription>{todayMeals.length} meals logged</CardDescription>
            </CardHeader>
            <CardContent>
              {todayMeals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No meals logged yet today.
                </p>
              ) : (
                <ul className="space-y-2">
                  {todayMeals.slice(0, 5).map((meal) => (
                    <li key={meal.id} className="text-sm">
                      {meal.mealCategory || "Meal"} -{" "}
                      {meal.proteinsUsed}P / {meal.carbsUsed}C / {meal.fatsUsed}F
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
```

---

### Task 18: Create Radial Chart Component

**File:** `frontend/web/components/domain/dashboard/macro-radial-chart.tsx`

```tsx
"use client";

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface MacroRadialChartProps {
  usedSlots: {
    proteins: number;
    fats: number;
    carbs: number;
    veggies: number;
    junk: number;
  };
  totalSlots: {
    proteins: number;
    fats: number;
    carbs: number;
    veggies: number;
    junk: number;
  };
}

const chartConfig = {
  proteins: { label: "Proteins", color: "hsl(var(--chart-1))" },
  carbs: { label: "Carbs", color: "hsl(var(--chart-2))" },
  fats: { label: "Fats", color: "hsl(var(--chart-3))" },
  veggies: { label: "Veggies", color: "hsl(var(--chart-4))" },
  junk: { label: "Junk", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

export function MacroRadialChart({ usedSlots, totalSlots }: MacroRadialChartProps) {
  const chartData = [
    {
      name: "Proteins",
      value: totalSlots.proteins > 0
        ? Math.min((usedSlots.proteins / totalSlots.proteins) * 100, 100)
        : 0,
      used: usedSlots.proteins,
      total: totalSlots.proteins,
      fill: "var(--color-proteins)",
    },
    {
      name: "Carbs",
      value: totalSlots.carbs > 0
        ? Math.min((usedSlots.carbs / totalSlots.carbs) * 100, 100)
        : 0,
      used: usedSlots.carbs,
      total: totalSlots.carbs,
      fill: "var(--color-carbs)",
    },
    {
      name: "Fats",
      value: totalSlots.fats > 0
        ? Math.min((usedSlots.fats / totalSlots.fats) * 100, 100)
        : 0,
      used: usedSlots.fats,
      total: totalSlots.fats,
      fill: "var(--color-fats)",
    },
    {
      name: "Veggies",
      value: totalSlots.veggies > 0
        ? Math.min((usedSlots.veggies / totalSlots.veggies) * 100, 100)
        : 0,
      used: usedSlots.veggies,
      total: totalSlots.veggies,
      fill: "var(--color-veggies)",
    },
    {
      name: "Junk",
      value: totalSlots.junk > 0
        ? Math.min((usedSlots.junk / totalSlots.junk) * 100, 100)
        : 0,
      used: usedSlots.junk,
      total: totalSlots.junk,
      fill: "var(--color-junk)",
    },
  ];

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
      <RadialBarChart
        data={chartData}
        startAngle={90}
        endAngle={-270}
        innerRadius="20%"
        outerRadius="100%"
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name, props) => {
                const item = props.payload;
                return `${item.used}/${item.total} slots`;
              }}
            />
          }
        />
        <RadialBar dataKey="value" background cornerRadius={10} />
      </RadialBarChart>
    </ChartContainer>
  );
}
```

---

### Task 19: Create Add Meal Page

**File:** `frontend/web/app/add-meal/page.tsx`

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MealForm } from "@/components/domain/meals/meal-form";

export default async function AddMealPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add Meal</h1>
        <p className="text-muted-foreground">
          Log your meal with macro information and optional photo.
        </p>
      </div>
      <MealForm />
    </div>
  );
}
```

**File:** `frontend/web/components/domain/meals/meal-form.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

const mealFormSchema = z.object({
  proteinsUsed: z.coerce.number().int().min(0),
  fatsUsed: z.coerce.number().int().min(0),
  carbsUsed: z.coerce.number().int().min(0),
  veggiesUsed: z.coerce.number().int().min(0),
  junkUsed: z.coerce.number().int().min(0),
  mealCategory: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]).optional(),
  notes: z.string().optional(),
});

type MealFormValues = z.infer<typeof mealFormSchema>;

export function MealForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealFormSchema),
    defaultValues: {
      proteinsUsed: 0,
      fatsUsed: 0,
      carbsUsed: 0,
      veggiesUsed: 0,
      junkUsed: 0,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  async function onSubmit(data: MealFormValues) {
    setIsSubmitting(true);

    try {
      let imagePath: string | undefined;

      // Upload image first if provided
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);

        const uploadRes = await fetch("/api/rest/v1/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload image");
        }

        const uploadData = await uploadRes.json();
        imagePath = uploadData.data.path;
      }

      // Create meal
      const mealData = {
        ...data,
        image: imagePath,
        notes: data.notes ? [data.notes] : undefined,
      };

      const res = await fetch("/api/rest/v1/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mealData),
      });

      if (!res.ok) {
        throw new Error("Failed to create meal");
      }

      toast.success("Meal added successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error("Failed to add meal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Macro Inputs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="proteinsUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proteins</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="carbsUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carbs</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fatsUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fats</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="veggiesUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Veggies</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="junkUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Junk</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Meal Category */}
        <FormField
          control={form.control}
          name="mealCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meal Type (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                  <SelectItem value="SNACK">Snack</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image Upload */}
        <div className="space-y-2">
          <FormLabel>Photo (Optional)</FormLabel>
          {imagePreview ? (
            <div className="relative w-full max-w-xs">
              <img
                src={imagePreview}
                alt="Meal preview"
                className="rounded-lg object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-4 hover:bg-muted">
                <Upload className="h-5 w-5" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          )}
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes about this meal..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Meal
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

---

### Task 20: Create Public Share Page

**File:** `frontend/web/app/share/[userId]/page.tsx`

```tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MealGallery } from "@/components/domain/share/meal-gallery";

interface SharePageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

async function getUserMeals(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      meals: {
        orderBy: { dateTime: "desc" },
        include: { notes: true },
        take: 100,
      },
    },
  });

  return user;
}

export default async function SharePage({ params }: SharePageProps) {
  const { userId } = await params;
  const user = await getUserMeals(userId);

  if (!user) {
    notFound();
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {user.firstName} {user.lastName}&apos;s Meal Log
        </h1>
        <p className="text-muted-foreground">
          Viewing shared meal history
        </p>
      </div>

      <MealGallery meals={user.meals} />
    </div>
  );
}

export async function generateMetadata({ params }: SharePageProps) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  if (!user) {
    return { title: "Not Found" };
  }

  return {
    title: `${user.firstName}'s Meal Log | Palm`,
    description: `View ${user.firstName} ${user.lastName}'s meal tracking history`,
  };
}
```

**File:** `frontend/web/components/domain/share/meal-gallery.tsx`

```tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MealDetailDialog } from "./meal-detail-dialog";

interface Meal {
  id: string;
  proteinsUsed: number;
  fatsUsed: number;
  carbsUsed: number;
  veggiesUsed: number;
  junkUsed: number;
  image: string | null;
  mealCategory: string | null;
  dateTime: Date;
  notes: { id: string; text: string }[];
}

interface MealGalleryProps {
  meals: Meal[];
}

export function MealGallery({ meals }: MealGalleryProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const sortedMeals = [...meals].sort((a, b) => {
    const dateA = new Date(a.dateTime).getTime();
    const dateB = new Date(b.dateTime).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meals.length} meals
        </p>
        <Select
          value={sortOrder}
          onValueChange={(value) => setSortOrder(value as "newest" | "oldest")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {sortedMeals.map((meal) => (
          <Card
            key={meal.id}
            className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
            onClick={() => setSelectedMeal(meal)}
          >
            {meal.image ? (
              <div className="aspect-square bg-muted">
                {/* Image will be loaded via signed URL in production */}
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Photo
                </div>
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-muted">
                <span className="text-4xl">🍽️</span>
              </div>
            )}
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {format(new Date(meal.dateTime), "MMM d, yyyy")}
                </span>
                {meal.mealCategory && (
                  <Badge variant="secondary" className="text-xs">
                    {meal.mealCategory}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {meal.proteinsUsed}P / {meal.carbsUsed}C / {meal.fatsUsed}F
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <MealDetailDialog
        meal={selectedMeal}
        open={!!selectedMeal}
        onOpenChange={(open) => !open && setSelectedMeal(null)}
      />
    </>
  );
}
```

---

## Phase 7: Configuration Updates

### Task 21: Update next.config.ts

**File:** `frontend/web/next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile images
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // For image uploads
    },
  },
};

export default nextConfig;
```

---

### Task 22: Update package.json Scripts

Add these scripts to `frontend/web/package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## List of Tasks to Complete (Ordered)

```yaml
# Phase 1: Backend Infrastructure
Task 1: CREATE backend/docker-compose.yml
  - PostgreSQL + pgAdmin configuration
  - Volume mounts for persistence
  - Health checks

Task 2: CREATE backend/.env.example
  - Document all backend env vars

Task 3: CREATE frontend/web/.env.example
  - Document all frontend env vars

Task 4: CREATE frontend/web/lib/config.ts
  - Typed environment variable access

# Phase 2: Database
Task 5: CREATE frontend/web/prisma/schema.prisma
  - User, Meal, Plan, Note models
  - Relations and indexes

Task 6: CREATE frontend/web/lib/prisma.ts
  - Prisma client singleton

# Phase 3: Authentication
Task 7: CREATE frontend/web/lib/auth.ts
  - Auth.js with Google OAuth
  - JWT callbacks for user data

Task 8: CREATE frontend/web/types/next-auth.d.ts
  - Type extensions for session

Task 9: CREATE frontend/web/app/api/auth/[...nextauth]/route.ts
  - Auth.js route handler

Task 10: CREATE frontend/web/middleware.ts
  - Route protection

# Phase 4: GCS Integration
Task 11: CREATE frontend/web/lib/gcs.ts
  - Upload, download, delete functions
  - Signed URL generation

# Phase 5: REST API
Task 12: CREATE frontend/web/app/api/rest/v1/meals/route.ts
  - GET (list), POST (create)

Task 13: CREATE frontend/web/app/api/rest/v1/meals/[id]/route.ts
  - GET, PUT, DELETE single meal

Task 14: CREATE frontend/web/app/api/rest/v1/plans/route.ts
  - GET (list), POST (create)

Task 15: CREATE frontend/web/app/api/rest/v1/plans/[id]/route.ts
  - GET, PUT, DELETE single plan

Task 16: CREATE frontend/web/app/api/rest/v1/plans/[id]/activate/route.ts
  - POST to set active plan

Task 17: CREATE frontend/web/app/api/rest/v1/upload/route.ts
  - Image upload to GCS

Task 18: CREATE frontend/web/app/api/rest/v1/users/me/route.ts
  - GET/PUT current user

# Phase 6: UI Components
Task 19: INSTALL shadcn/ui components via CLI
  - Run install commands

Task 20: CREATE frontend/web/components/ui/* (via shadcn CLI)
  - Button, Card, Dialog, Form, Input, etc.

Task 21: CREATE frontend/web/components/common/providers.tsx
  - SessionProvider wrapper

Task 22: CREATE frontend/web/components/common/user-nav.tsx
  - User dropdown component

Task 23: CREATE frontend/web/components/domain/dashboard/app-sidebar.tsx
  - Sidebar navigation

Task 24: CREATE frontend/web/components/domain/dashboard/macro-radial-chart.tsx
  - Radial chart for macros

Task 25: CREATE frontend/web/components/domain/meals/meal-form.tsx
  - Add/edit meal form

Task 26: CREATE frontend/web/components/domain/meals/meals-table.tsx
  - DataTable for meals CRUD

Task 27: CREATE frontend/web/components/domain/share/meal-gallery.tsx
  - Gallery for share page

# Phase 7: Pages
Task 28: UPDATE frontend/web/app/layout.tsx
  - Add providers, Toaster

Task 29: CREATE frontend/web/app/(dashboard)/layout.tsx
  - Dashboard layout with sidebar

Task 30: CREATE frontend/web/app/(dashboard)/dashboard/page.tsx
  - Home tab with radial chart

Task 31: CREATE frontend/web/app/(dashboard)/meals/page.tsx
  - Meals DataTable page

Task 32: CREATE frontend/web/app/(dashboard)/plans/page.tsx
  - Plans management page

Task 33: CREATE frontend/web/app/(dashboard)/settings/page.tsx
  - User settings, share link

Task 34: CREATE frontend/web/app/add-meal/page.tsx
  - Add meal form page

Task 35: CREATE frontend/web/app/share/[userId]/page.tsx
  - Public share page

Task 36: CREATE frontend/web/app/(auth)/signin/page.tsx
  - Custom sign-in page

# Phase 8: Configuration
Task 37: UPDATE frontend/web/next.config.ts
  - Image domains, body size limit

Task 38: UPDATE frontend/web/package.json
  - Add scripts for typecheck, db commands

Task 39: RUN database migrations
  - prisma db push / migrate dev

# Phase 9: Documentation
Task 40: CREATE backend/README.md
  - Setup instructions

Task 41: UPDATE frontend/web/README.md
  - Setup and usage docs

Task 42: UPDATE CLAUDE.md
  - Add palm-specific patterns
```

---

## Validation Loop

### Level 1: Syntax & Style

```bash
cd frontend/web

# Run these FIRST - fix any errors before proceeding
pnpm run typecheck     # tsc --noEmit
pnpm run lint          # eslint .

# Expected: No errors
```

### Level 2: Database

```bash
# Start PostgreSQL
cd backend && docker-compose up -d

# Generate Prisma client and push schema
cd ../frontend/web
pnpm run db:generate
pnpm run db:push

# Verify with Prisma Studio
pnpm run db:studio
```

### Level 3: Build

```bash
# Build must succeed
pnpm run build

# Expected: No errors, all pages compile
```

### Level 4: Manual Testing

```bash
# Start dev server
pnpm run dev

# Test flows:
# 1. Sign in with Google
# 2. Create a plan
# 3. Activate the plan
# 4. Add a meal with image
# 5. View dashboard with radial chart
# 6. Copy share link from settings
# 7. Open share link in incognito (no auth)
```

---

## Environment Variables Summary

```bash
# Required for frontend/web/.env.local

# Database
DATABASE_URL="postgresql://postgres:changeme@localhost:5432/palm_db"

# Auth.js
AUTH_SECRET="<generate with: openssl rand -base64 32>"
AUTH_GOOGLE_ID="<from Google Cloud Console>"
AUTH_GOOGLE_SECRET="<from Google Cloud Console>"
AUTH_URL="http://localhost:3000"

# Google Cloud Storage
GCS_BUCKET_NAME="palm-meal-images"
GCP_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Public
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Google OAuth Setup:**
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret to `.env.local`

---

## Final Validation Checklist

- [ ] All tasks pass: `pnpm typecheck && pnpm lint`
- [ ] Database migrations applied: `pnpm db:push`
- [ ] Build succeeds: `pnpm build`
- [ ] Google OAuth working
- [ ] Can create/activate plans
- [ ] Can add meals with images
- [ ] Dashboard shows radial chart with correct data
- [ ] Share page accessible without auth
- [ ] REST API endpoints respond correctly

---

## Anti-Patterns to Avoid

- Do NOT import Prisma client in client components
- Do NOT use `useRouter` or `useSearchParams` in RSC files
- Do NOT skip Zod validation in route handlers
- Do NOT commit `.env.local` or secrets
- Do NOT use client-side state for data that should be server-fetched
- Do NOT forget `revalidatePath()` after mutations
- Do NOT skip a11y (labels, focus management, keyboard nav)

---

## Score

**Confidence Level: 8/10**

This PRP provides comprehensive context including:
- Complete database schema with Prisma
- Full Auth.js v5 integration with Google OAuth
- GCS integration based on user's existing patterns
- REST API with Zod validation
- shadcn/ui components with proper patterns
- All file paths and code examples

Risks:
- GCS credentials setup may require user intervention
- Google OAuth setup requires manual console configuration
- Some shadcn/ui component variations may need adjustment
- Testing infrastructure not fully detailed (would need separate PRP)
