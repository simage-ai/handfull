# Dockerfile Documentation

This document explains the Dockerfile structure for deploying HandFull web to Cloud Run.

## Overview

The Dockerfile uses a **multi-stage build** to create an optimized production image:

```
Stage 1: deps     → Install dependencies
Stage 2: builder  → Build the Next.js application
Stage 3: runner   → Minimal production image
```

## Prerequisites

Before using the Dockerfile, you need to enable **standalone output** in Next.js:

### Update `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",  // ← Add this line
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
```

## File Placement

Copy the Dockerfile to the web frontend directory:

```bash
cp docs/web-deployment/Dockerfile frontend/web/Dockerfile
```

## Build Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (baked into client bundle) |

### Why Build Arguments?

`NEXT_PUBLIC_*` environment variables are **embedded at build time** into the JavaScript bundle. They cannot be changed at runtime. This is why we pass them as build arguments rather than runtime environment variables.

## Stages Explained

### Stage 1: Dependencies (`deps`)

```dockerfile
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
```

- Uses Node.js 22 Alpine (small image)
- Enables pnpm via corepack
- Installs dependencies with frozen lockfile for reproducibility
- Cached layer - only rebuilds when package files change

### Stage 2: Builder (`builder`)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN pnpm db:generate
RUN pnpm build
```

- Copies dependencies from deps stage
- Copies source code
- Sets build-time environment variables
- Generates Prisma client
- Builds Next.js application in standalone mode

### Stage 3: Runner (`runner`)

```dockerfile
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only what's needed
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
```

- Minimal production image
- Runs as non-root user (security best practice)
- Only includes necessary files:
  - Standalone server output
  - Static files
  - Public assets
  - Prisma client (for database operations)
- Listens on port 8080 (Cloud Run default)

## Local Testing

### Build the image

```bash
cd frontend/web

docker build -t handball-web \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx \
  .
```

### Run locally

```bash
docker run -p 3000:8080 \
  -e DATABASE_URL="postgresql://user:pass@host.docker.internal:5433/palm_db" \
  -e NEXTAUTH_SECRET="test-secret-at-least-32-chars-long" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  -e AUTH_GOOGLE_ID="your-google-client-id" \
  -e AUTH_GOOGLE_SECRET="your-google-client-secret" \
  handball-web
```

### Test with local database

If running the local PostgreSQL from `backend/docker-compose.yml`:

```bash
# Start local database
cd backend && docker-compose up -d

# Run the web container
docker run -p 3000:8080 \
  --network palm_network \
  -e DATABASE_URL="postgresql://postgres:changeme@palm_postgres:5432/palm_db" \
  -e NEXTAUTH_SECRET="test-secret-at-least-32-chars-long" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  handball-web
```

## Image Size

The final image should be approximately **150-250MB**, containing:
- Node.js Alpine base (~50MB)
- Next.js standalone server (~50MB)
- Application code and dependencies (~50-150MB)

## Troubleshooting

### Build fails with "Cannot find module"

Ensure all dependencies are in `package.json` and `pnpm-lock.yaml` is up to date:
```bash
pnpm install
git add pnpm-lock.yaml
```

### Prisma client not found at runtime

The Dockerfile copies Prisma files in the runner stage. If you still get errors:
```dockerfile
# Ensure these are copied
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
```

### Container starts but can't connect to database

For Cloud Run with Cloud SQL:
- Use Unix socket connection: `?host=/cloudsql/PROJECT:REGION:INSTANCE`
- Ensure the Cloud SQL connection is added to the Cloud Run service

For local testing:
- Use `host.docker.internal` to connect to host machine
- Or use Docker network to connect to other containers

### NEXT_PUBLIC variables not working

These must be set at **build time**, not runtime:
```bash
docker build --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx .
```

## Security Notes

1. **Non-root user**: Container runs as `nextjs` user, not root
2. **Minimal image**: Only production dependencies included
3. **No secrets in image**: All sensitive data comes from environment variables at runtime
4. **Alpine base**: Smaller attack surface than full Debian images
