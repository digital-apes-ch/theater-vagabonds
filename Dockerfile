# syntax=docker.io/docker/dockerfile:1

# ---------- base ----------
FROM node:20-alpine AS base

# ---------- dependencies ----------
FROM base AS deps
WORKDIR /app

# Kopiere nur package files für besseres Caching
COPY package*.json ./

# Installiere nur Production Dependencies
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ---------- runner ----------
FROM base AS runner
WORKDIR /app

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Runtime ARGs (werden zur Laufzeit benötigt)
ARG BASE_URL
ARG TICKET_LINK_1
ARG TICKET_LINK_2
ARG TICKET_LINK_3
ARG TICKET_LINK_4

# ARGs als ENV setzen
ENV BASE_URL=${BASE_URL:-https://theatervagabunden.ch}
ENV TICKET_LINK_1=${TICKET_LINK_1:-#}
ENV TICKET_LINK_2=${TICKET_LINK_2:-#}
ENV TICKET_LINK_3=${TICKET_LINK_3:-#}
ENV TICKET_LINK_4=${TICKET_LINK_4:-#}

# System user für Security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 webapp

# Kopiere Dependencies aus deps Stage
COPY --from=deps --chown=webapp:nodejs /app/node_modules ./node_modules

# Kopiere Applikationscode
COPY --chown=webapp:nodejs server.js ./
COPY --chown=webapp:nodejs index.html ./
COPY --chown=webapp:nodejs impressum.html ./
COPY --chown=webapp:nodejs robots.txt ./
COPY --chown=webapp:nodejs sitemap.xml ./
COPY --chown=webapp:nodejs styles ./styles
COPY --chown=webapp:nodejs source ./source

# Health check für Docker Swarm
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Labels für Swarm Metadata
LABEL org.opencontainers.image.title="Theater Vagabunden Tuggen"
LABEL org.opencontainers.image.description="Theater Vagabunden Tuggen - Website"
LABEL org.opencontainers.image.version="1.0.0"
LABEL maintainer="Digital Apes"

USER webapp
EXPOSE 3000

# Graceful shutdown support für Rolling Updates
STOPSIGNAL SIGTERM

CMD ["node", "server.js"]
