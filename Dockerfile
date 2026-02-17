# syntax=docker.io/docker/dockerfile:1

# ---------- base ----------
FROM node:20-alpine AS base

# ---------- builder ----------
FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN npm i -g bun

WORKDIR /app
COPY . .

# Build-Args für NEXT_PUBLIC_ Variablen (werden zur Build-Zeit benötigt)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build-Args als ENV setzen für Next.js Build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Dependencies und Build
RUN rm -rf node_modules
RUN bun install
RUN bun run build

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

# Environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# System user für Security
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone server + minimal node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Health check für Docker Swarm
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Labels für Swarm Metadata
LABEL org.opencontainers.image.title="Theater Vagabonds"
LABEL org.opencontainers.image.description="Next.js Theater Vagabonds Application"
LABEL org.opencontainers.image.version="1.0.0"
LABEL maintainer="Digital Apes"

USER nextjs
EXPOSE 3000

# Graceful shutdown support für Rolling Updates
STOPSIGNAL SIGTERM

CMD ["node", "server.js"]
