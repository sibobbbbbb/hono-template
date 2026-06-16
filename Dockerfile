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
CMD ["bun", "src/index.ts"]
