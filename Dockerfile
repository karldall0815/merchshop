# Multi-Stage Build für die MerchShop Next.js App.

# Use Debian-slim everywhere — Alpine's musl libc collides with Prisma's
# native query engine (openssl version detection, schema engine binary loader).

# ===== 1. Deps =====
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ===== 2. Build =====
FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# ===== 3. Runner =====
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Prisma's query engine needs libssl at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Non-root user (Debian adduser syntax)
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --shell /usr/sbin/nologin nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Full node_modules for the Prisma CLI (migrate deploy at startup) plus the
# generated client. With pnpm's .pnpm/ symlink layout this is the most
# reliable path; the size hit is acceptable for Phase 1.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

# On every container start:
#   1. Apply pending Prisma migrations.
#   2. Run the (idempotent, upsert-based) seed — keeps built-in categories and
#      default settings in sync with the code without manual intervention.
#   3. Launch the standalone Next.js server.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && ./node_modules/.bin/tsx prisma/seed.ts && node server.js"]
