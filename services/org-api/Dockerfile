# ============================================================================
# Multi-stage Dockerfile for Organizoptera org-api
# ============================================================================
# Optimized for monorepo with workspace dependencies
# ============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all package.json files for workspace
COPY packages/types/package.json ./packages/types/
COPY packages/core/package.json ./packages/core/
COPY packages/@organizoptera/subscription/package.json ./packages/@organizoptera/subscription/
COPY packages/@organizoptera/billing/package.json ./packages/@organizoptera/billing/
COPY packages/@organizoptera/resources/package.json ./packages/@organizoptera/resources/
COPY packages/@organizoptera/curriculoptera-adapter/package.json ./packages/@organizoptera/curriculoptera-adapter/
COPY services/org-api/package.json ./services/org-api/

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Build
# -----------------------------------------------------------------------------
FROM deps AS builder

# Copy all source code (packages will be built at runtime)
COPY . .

# -----------------------------------------------------------------------------
# Stage 3: Production Runtime
# -----------------------------------------------------------------------------
FROM node:22-alpine AS production

# Install pnpm and dumb-init
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copy workspace config
COPY --from=builder --chown=nestjs:nodejs /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./

# Copy all packages source code
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

COPY --from=builder --chown=nestjs:nodejs /app/services/org-api/src ./services/org-api/src
COPY --from=builder --chown=nestjs:nodejs /app/services/org-api/generated ./services/org-api/generated
COPY --from=builder --chown=nestjs:nodejs /app/services/org-api/package.json ./services/org-api/
COPY --from=builder --chown=nestjs:nodejs /app/services/org-api/tsconfig.json ./services/org-api/
COPY --from=builder --chown=nestjs:nodejs /app/services/org-api/nest-cli.json ./services/org-api/

# Copy tsconfig.base.json
COPY --from=builder --chown=nestjs:nodejs /app/tsconfig.base.json ./

# Copy Prisma schema and migrations
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Copy node_modules from deps stage (has all dependencies correctly installed)
COPY --from=deps /app/node_modules ./node_modules

# Generate Prisma Client as root
WORKDIR /app
RUN pnpm exec prisma generate

# Build all workspace packages and org-api as root
WORKDIR /app
RUN pnpm --filter @organizoptera/types build && \
    pnpm --filter @organizoptera/core build && \
    pnpm --filter @organizoptera/subscription build && \
    pnpm --filter @organizoptera/billing build && \
    pnpm --filter @organizoptera/resources build && \
    pnpm --filter @organizoptera/curriculoptera-adapter build && \
    cd services/org-api && \
    pnpm exec tsc

# Ensure nestjs user owns everything in /app for runtime operations
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set environment to production
ENV NODE_ENV=production

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "services/org-api/dist/main.js"]
