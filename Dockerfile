# syntax=docker.io/docker/dockerfile:1

# ---------- dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Kopiere nur package files für besseres Layer Caching
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# System user für Security
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 expressapp

# Kopiere Dependencies
COPY --from=deps --chown=expressapp:nodejs /app/node_modules ./node_modules

# Kopiere Application Code und statische Assets
COPY --chown=expressapp:nodejs . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Labels für Metadata
LABEL org.opencontainers.image.title="Theater Vagabunden Tuggen"
LABEL org.opencontainers.image.description="Theater Vagabunden Website"
LABEL org.opencontainers.image.version="1.0.0"
LABEL maintainer="Theater Vagabunden Tuggen"

USER expressapp
EXPOSE 3000

# Graceful shutdown support
STOPSIGNAL SIGTERM

CMD ["node", "server.js"]
