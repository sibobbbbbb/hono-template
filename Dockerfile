# syntax=docker/dockerfile:1

# --- deps: install production dependencies only ---
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# --- release: production image ---
FROM oven/bun:1 AS release
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER bun

# Liveness probe: hit the (DB-free) health endpoint using the bundled Bun runtime
# so the image needs no extra tools (curl/wget). Readiness (DB) is checked by the
# orchestrator via /api/v1/health/ready.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
	CMD bun -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/api/v1/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "src/index.ts"]
