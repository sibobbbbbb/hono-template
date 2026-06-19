# Hono API Template

<p align="center">
    <img src="https://raw.githubusercontent.com/honojs/hono/main/docs/images/hono-logo.png" alt="Hono Logo" width="150">
</p>

<p align="center">
    <strong>An ultrafast, type-safe, production-ready API template built with Hono, Bun, and Drizzle ORM — with end-to-end RPC types.</strong>
</p>

<p align="center">
    <a href="#"><img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-blue.svg"></a>
    <a href="#"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-blue.svg"></a>
    <a href="#"><img alt="Bun" src="https://img.shields.io/badge/Bun-1.x-black?logo=bun&logoColor=white"></a>
    <a href="#"><img alt="Biome" src="https://img.shields.io/badge/Biome-2.x-60a5fa?logo=biome&logoColor=white"></a>
</p>

---

A solid foundation for modern, high-performance APIs. It ships with a complete
authentication system (refresh-token rotation + sessions), role-based access
control, secure-by-default middleware, a clean modular architecture, consistent
API conventions, optional Redis/OpenTelemetry integrations, and a fully typed
RPC client.

## ✨ Features

- **⚡ Bun-native** — runtime, package manager, and test runner. No build step in development.
- **🔒 Type-safe everywhere** — `@hono/zod-validator` yields `c.req.valid()` with **zero casts**; routes are chained so a typed [RPC client](#-typed-rpc-client) is exported for free.
- **🏗️ Layered & functional** — `route → service → repository`. Services are factory functions (trivial to unit-test, no DI container).
- **🔐 Secure auth + RBAC** — argon2id password hashing (`Bun.password`), access token in the body, refresh token in an `HttpOnly` `SameSite=Strict` cookie, **full-length SHA-256** refresh-token hashing, **session-backed rotation + reuse-detection**, and a `requireRole` guard for admin-only routes.
- **🧭 Consistent API conventions** — **`/api/v1` versioning**, a uniform success/error envelope, **machine-readable error `code`s** (e.g. `NOT_FOUND`), and **pagination** helpers for list endpoints.
- **🛡️ Hardened defaults** — `secureHeaders`, CORS, body-size limit, request id, IP-aware rate limiting (**optional Redis store**), Zod-validated env, and a centralized error handler with severity-aware logging (4xx → `warn`, 5xx → `error`).
- **🗄️ Drizzle ORM** — PostgreSQL with migrations and auto-inferred types; sensitive columns are projected away at the data layer, and records use **soft delete** (`deleted_at`) so reads exclude deleted rows.
- **📈 Observability-ready** — request-id correlation, a pluggable **error-reporter** hook (wire up Sentry/OTLP in one line), and an opt-in **OpenTelemetry** bootstrap gated behind `OTEL_ENABLED` (no forced dependencies).
- **🧹 Biome** — lint + format in a single fast binary.
- **✅ Tests** — unit + integration on `bun:test`; integration runs against an in-memory **PGlite** database (no Docker), with a dual-mode harness that targets real Postgres in CI.
- **📖 OpenAPI docs** — every route is annotated; the spec is served at `/openapi` with an interactive **Scalar** UI at `/docs`.
- **🚢 Ship-ready** — GitHub Actions CI (PGlite + real-Postgres jobs), a multi-stage Dockerfile with a `HEALTHCHECK`, a full `docker compose` stack, graceful shutdown, and a database **readiness** probe.

## 🛠️ Tech Stack

| Category        | Technology                                            |
| --------------- | ----------------------------------------------------- |
| **Runtime**     | [Bun](https://bun.sh/)                                |
| **Framework**   | [Hono](https://hono.dev/)                             |
| **Database**    | [PostgreSQL](https://www.postgresql.org/)             |
| **ORM**         | [Drizzle ORM](https://orm.drizzle.team/)              |
| **Validation**  | [Zod](https://zod.dev/) v4 + `@hono/zod-validator`    |
| **Auth**        | `hono/jwt`, `Bun.password` (argon2id)                 |
| **Logging**     | `pino` + `hono-pino`                                  |
| **Rate limit**  | `hono-rate-limiter` (memory or **optional** Redis)    |
| **Tracing**     | **Optional** [OpenTelemetry](https://opentelemetry.io/) |
| **Lint/Format** | [Biome](https://biomejs.dev/)                         |
| **Tests**       | `bun:test` + [PGlite](https://pglite.dev/)            |
| **Container**   | [Docker](https://www.docker.com/)                     |

## 📂 Project Structure

A feature-based (modular) architecture — code is grouped by domain for cohesion and scalability.

```
/
├── drizzle/                 # Drizzle Kit migration files
└── src/
    ├── index.ts             # App entry: middleware, router mount, AppType export
    ├── routes/              # Aggregates module routers, mounted under /api/v1
    ├── modules/             # Core feature modules
    │   ├── auth/            # auth.route · auth.service · auth.schemas · auth.token.helper
    │   ├── health/          # Liveness + readiness probes
    │   └── user/            # User feature (profile, admin list)
    ├── shared/
    │   ├── configs/         # environment (Zod-validated), database, logger, observability
    │   ├── exceptions/      # ApiError hierarchy (with codes) + global error handler
    │   ├── middlewares/     # auth (JWT/requireRole), rate-limiter (+ Redis store), validator
    │   ├── models/          # Drizzle-inferred types (User, NewUser, SafeUser)
    │   ├── repositories/    # Data access layer (soft-delete aware)
    │   └── utils/           # api-response, cookie-helper, pagination, ...
    └── types/               # Ambient typings (jwtPayload, requestId context variables)
```

**Request flow:** the route handler validates input and shapes the response →
the **service** holds business logic → the **repository** talks to the DB.
Handlers stay thin so their types compose into the exported `AppType`.

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) ≥ 1.2
- [Docker](https://www.docker.com/) and Docker Compose (or your own PostgreSQL)

### Steps

```bash
# 1. Clone
git clone https://github.com/sibobbbbbb/hono-template.git
cd hono-template

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env        # then edit the secrets

# 4. Start PostgreSQL
docker compose up -d db

# 5. Apply the schema
bun run db:push             # or: bun run db:generate && bun run db:migrate

# 6. Run the dev server (hot reload)
bun run dev
```

The server runs on `http://localhost:3000` (or your `PORT`).

> Want the whole stack in containers? `docker compose up --build` starts both
> Postgres and the app; then apply migrations against the exposed db with
> `bun run db:migrate`.

## 🔑 Environment Variables

Validated at startup by [`src/shared/configs/environment`](src/shared/configs/environment/index.ts) — the app refuses to boot on misconfiguration.

| Variable                     | Default        | Description                                  |
| ---------------------------- | -------------- | -------------------------------------------- |
| `POSTGRES_USER`              | —              | Database user (required)                     |
| `POSTGRES_PASSWORD`          | —              | Database password (required)                 |
| `POSTGRES_DB`                | —              | Database name (required)                     |
| `DB_HOST`                    | `localhost`    | Database host                                |
| `DB_PORT`                    | `5432`         | Database port                                |
| `DATABASE_URL`               | —              | Optional connection string (overrides individual DB vars) |
| `DB_SSL`                     | `false`        | Enable SSL (required by most managed Postgres) |
| `DB_POOL_MAX`                | `10`           | Max connection pool size                     |
| `JWT_SECRET`                 | —              | Access-token secret (required)               |
| `JWT_EXPIRES_IN`             | `15m`          | Access-token lifetime                        |
| `JWT_REFRESH_SECRET`         | —              | Refresh-token secret (required)              |
| `JWT_REFRESH_EXPIRES_IN`     | `7d`           | Refresh-token lifetime                       |
| `JWT_REFRESH_COOKIE_NAME`    | `refreshToken` | Refresh-token cookie name                    |
| `REDIS_URL`                  | —              | Optional; when set, rate-limit counters are stored in Redis |
| `OTEL_ENABLED`               | `false`        | Enable the OpenTelemetry bootstrap           |
| `OTEL_SERVICE_NAME`          | `hono-api`     | Service name reported to the tracer          |
| `OTEL_EXPORTER_OTLP_ENDPOINT`| —              | OTLP endpoint (read by the OTel SDK)         |
| `NODE_ENV`                   | `development`  | `development` \| `production` \| `test`      |
| `CORS_ORIGIN`                | `*`            | Allowed CORS origin (set explicitly in prod) |
| `PORT`                       | `3000`         | Server port                                  |

## 📡 API Endpoints

All application routes are versioned under **`/api/v1`**.

| Method | Path                    | Auth | Description                            |
| ------ | ----------------------- | ---- | -------------------------------------- |
| GET    | `/api/v1/health`        | —    | Liveness probe                         |
| GET    | `/api/v1/health/ready`  | —    | Readiness probe (checks the database)  |
| POST   | `/api/v1/auth/register` | —    | Register a new user                    |
| POST   | `/api/v1/auth/login`    | —    | Log in; sets refresh cookie            |
| POST   | `/api/v1/auth/refresh`  | 🍪   | Rotate tokens using the refresh cookie |
| POST   | `/api/v1/auth/logout`   | ✅   | Revoke the refresh token               |
| GET    | `/api/v1/users/profile` | ✅   | Get the current user's profile         |
| GET    | `/api/v1/users`         | 👑   | List users (paginated, admin only)     |
| GET    | `/openapi`              | —    | OpenAPI 3.1 spec (JSON)                |
| GET    | `/docs`                 | —    | Interactive API docs (Scalar UI)       |

✅ = `Authorization: Bearer <accessToken>` · 👑 = `Bearer` token with the `admin` role · 🍪 = refresh-token cookie

## 🧭 API Conventions

- **Versioning** — every route lives under `/api/v1`; bump the mount point in
  [`src/index.ts`](src/index.ts) to introduce a new version.
- **Success envelope** — `{ "success": true, "message": "...", "data": ..., "meta"?: ... }`.
- **Error envelope** — `{ "success": false, "code": "NOT_FOUND", "message": "...", "requestId"?: "..." }`.
  The `code` is stable and machine-readable (`BAD_REQUEST`, `UNAUTHORIZED`,
  `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`, …), so clients
  branch on it without parsing human messages.
- **Pagination** — list endpoints accept `?page` and `?limit` (default `20`,
  max `100`) and return a `meta` block: `{ page, limit, total, totalPages }`.
- **Soft delete** — rows carry a `deleted_at` timestamp; the repository layer
  excludes soft-deleted records from reads by default.

## 🔐 Authentication & Authorization

- **Passwords** are hashed with **argon2id** via `Bun.password`.
- **Access tokens** (short-lived) are returned in the JSON body; send them as `Authorization: Bearer <token>`. The token carries the user's `sub`, `name`, and `role`.
- **Refresh tokens** (long-lived) live in an `HttpOnly`, `SameSite=Strict` cookie scoped to `/api/v1/auth`. The server stores only a **full-length SHA-256 hash** of the token in a `sessions` table (no bcrypt 72-byte truncation).
- **Rotation + reuse-detection:** every `/refresh` issues a new token pair and replaces the stored session. Presenting a stale (already-rotated) token is rejected with `403`, forcing re-authentication.
- **Roles:** users have a `role` (`user` | `admin`). The `requireRole("admin")` middleware guards admin-only routes such as `GET /api/v1/users`.

## 🔗 Typed RPC Client

Because routes use chained, inline handlers, the app type is exported for the
[Hono RPC client](https://hono.dev/docs/guides/rpc):

```ts
import { hc } from "hono/client";
import type { AppType } from "./src";

const client = hc<AppType>("http://localhost:3000");

const res = await client.api.v1.auth.login.$post({
  json: { email: "ada@example.com", password: "supersecret" },
});
// Request body and response are inferred from the Zod schema — no codegen.
```

## 📜 Scripts

| Script                | Description                                  |
| --------------------- | -------------------------------------------- |
| `bun run dev`         | Dev server with hot reload                   |
| `bun run start`       | Start the server                             |
| `bun run build`       | Bundle to `dist/` (optional, for deployment) |
| `bun run typecheck`   | Type-check with `tsc --noEmit`               |
| `bun test`            | Run the test suite                           |
| `bun run lint`        | Lint with Biome                              |
| `bun run lint:fix`    | Lint + autofix + format                      |
| `bun run format`      | Format with Biome                            |
| `bun run db:generate` | Generate a Drizzle migration                 |
| `bun run db:migrate`  | Apply migrations                             |
| `bun run db:push`     | Push the schema directly (dev only)          |

> **Note:** `db:push` is for rapid prototyping. Prefer `db:generate` + `db:migrate` in production.

## ✅ Testing

A clean split between fast unit tests and full integration tests, all on `bun:test`:

- **Unit tests** live next to the code (`src/**/*.test.ts`). Pure functions and services are tested in isolation with an in-memory fake repository — no I/O.
- **Integration tests** live in `tests/integration/`. They drive the real app via `app.request()` against an **in-memory PGlite database** (embedded Postgres), so the full `middleware → handler → service → repository → SQL` path runs with **no Docker and no external Postgres**. The schema is migrated once and tables are truncated between tests. Production code is untouched: `tests/setup.ts` redirects the app's `db` to PGlite via `mock.module` only during the test run. Set `DATABASE_URL` to run the same suite against a real Postgres (as CI does).

```
tests/
├─ setup.ts                    # preload: migrate PGlite + redirect the app's db to it
├─ helpers/
│  ├─ test-db.ts               # in-memory PGlite instance + migrate/reset
│  ├─ fake-user-repository.ts  # in-memory repo + user factory for unit tests
│  └─ auth.ts                  # HTTP helpers (register/login, auth headers)
└─ integration/                # *.test.ts hitting the real app + DB
```

| Command | Description |
| ------- | ----------- |
| `bun test` | Run the whole suite |
| `bun run test:unit` | Unit tests only (`src`) |
| `bun run test:integration` | Integration tests only |
| `bun run test:watch` | Watch mode |
| `bun run test:coverage` | Coverage report (gated at 80%) |

## 💅 Code Quality

This project uses **[Biome](https://biomejs.dev/)** for both linting and
formatting (replacing ESLint + Prettier with a single fast binary).

```bash
bun run lint       # check
bun run lint:fix   # autofix + format
```

> **VS Code:** install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) and enable "Format on Save".

## 📈 Observability

- **Correlation ids** — the `requestId()` middleware tags every request; the id is echoed in error responses (`requestId`) and attached to logs.
- **Error reporting** — register a sink once at startup and every unhandled 5xx is forwarded to it (the hook never throws):

  ```ts
  import { setErrorReporter } from "@/shared/configs/observability/error-reporter";
  setErrorReporter((err, ctx) => Sentry.captureException(err, { extra: ctx }));
  ```

- **OpenTelemetry (opt-in)** — install the SDK and enable the flag; the bootstrap
  is a safe no-op otherwise (no forced dependency):

  ```bash
  bun add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
  # then set OTEL_ENABLED=true and OTEL_EXPORTER_OTLP_ENDPOINT
  ```

## ☁️ Runtime Notes

Bun-native and runs on Node-like servers. For a true edge deployment (e.g.
Cloudflare Workers) a few runtime-bound pieces would need swapping:

- `Bun.password` (argon2id) and `getConnInfo` from `hono/bun` → a WASM hasher + the platform's conninfo helper.
- `postgres` (TCP) → an HTTP driver such as `drizzle-orm/neon-http`.
- `pino-pretty` transport (dev only) → a console logger.

The rate limiter defaults to an in-memory store (fine for a single instance).
For multi-instance / serverless, set `REDIS_URL` to share counters across
processes via the built-in Redis-backed store.

## 🚢 Deployment

A multi-stage [Dockerfile](Dockerfile) builds a lean, non-root production image
(production dependencies only) with a built-in `HEALTHCHECK`:

```bash
docker build -t hono-template .
docker run --env-file .env -p 3000:3000 hono-template
```

Or run the full stack (Postgres + app) with [docker compose](docker-compose.yml):

```bash
docker compose up --build      # starts db + app
bun run db:migrate             # apply migrations against the exposed db
```

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs lint, type-check,
and the test suite (PGlite) on every push and pull request, plus a second job
that migrates and tests against a real Postgres service. Run database migrations
(`bun run db:migrate`) as a separate release step in production.

## ⚖️ License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
