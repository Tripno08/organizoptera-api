# Multi-stage Dockerfile for Organizoptera org-api
# Optimized for Railway deployment

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

WORKDIR /app

# Copy workspace configs
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package.json files for workspace
COPY packages/@organizoptera/billing/package.json ./packages/@organizoptera/billing/
COPY packages/@organizoptera/subscription/package.json ./packages/@organizoptera/subscription/
COPY packages/@organizoptera/resources/package.json ./packages/@organizoptera/resources/
COPY packages/@organizoptera/curriculoptera-adapter/package.json ./packages/@organizoptera/curriculoptera-adapter/
COPY packages/@organizoptera/types/package.json ./packages/@organizoptera/types/
COPY packages/@organizoptera/core/package.json ./packages/@organizoptera/core/
COPY packages/@organizoptera/rbac/package.json ./packages/@organizoptera/rbac/

COPY services/org-api/package.json ./services/org-api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy source code
COPY packages/ ./packages/
COPY services/ ./services/
COPY prisma/ ./prisma/

# Generate Prisma Client
RUN pnpm --filter org-api exec prisma generate --schema=../../prisma/schema.prisma

# Build all packages
RUN pnpm --filter "./packages/**" build

# Build org-api service
RUN cd services/org-api && pnpm build

# ============================================
# Stage 3: Production
# ============================================
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/org-api/dist ./services/org-api/dist
COPY --from=builder /app/services/org-api/node_modules ./services/org-api/node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy Prisma files for migrations
COPY prisma ./prisma
COPY services/org-api/package.json ./services/org-api/

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start command (migrations + app)
CMD ["sh", "-c", "cd services/org-api && pnpm prisma migrate deploy && node dist/main.js"]
