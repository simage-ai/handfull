# =============================================================================
# HandFull Web - Multi-stage Dockerfile for Next.js 16 on Cloud Run
# =============================================================================
# This Dockerfile uses a multi-stage build to create an optimized production
# image using Next.js standalone output mode.
#
# Build args:
#   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Stripe publishable key (public)
#   - NEXT_PUBLIC_APP_URL: Application URL for emails/links (public)
#
# Usage:
#   docker build -t handball-web \
#     --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx \
#     --build-arg NEXT_PUBLIC_APP_URL=https://handfull.simage.ai \
#     -f frontend/web/Dockerfile \
#     frontend/web
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for public environment variables
# These are baked into the client bundle at build time
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Generate Prisma client
RUN pnpm db:generate

# Build the application
# Next.js will use standalone output mode (configured in next.config.ts)
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 3: Runner (Production)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output
# The standalone folder contains a minimal Node.js server
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema and generated client for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Set ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose Cloud Run's expected port
EXPOSE 8080

# Health check (optional, Cloud Run has its own)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start the server
# The standalone server.js is a minimal Next.js server
CMD ["node", "server.js"]
