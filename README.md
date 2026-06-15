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
authentication system (refresh-token rotation), secure-by-default middleware, a
clean modular architecture, and a fully typed RPC client.

## ✨ Features

- **⚡ Bun-native** — runtime, package manager, and test runner. No build step in development.
- **🔒 Type-safe everywhere** — `@hono/zod-validator` yields `c.req.valid()` with **zero casts**; routes are chained so a typed [RPC client](#-typed-rpc-client) is exported for free.
- **🏗️ Layered & functional** — `route → service → repository`. Services are factory functions (trivial to unit-test, no DI container).
- **🔐 Secure auth** — argon2id password hashing (`Bun.password`), access token in the body, refresh token in an `HttpOnly` `SameSite=Strict` cookie, **full-length SHA-256** refresh-token hashing, and **rotation + reuse-detection**.
- **🛡️ Hardened defaults** — `secureHeaders`, CORS, body-size limit, request id, IP-aware rate limiting, Zod-validated env, and a centralized error handler with severity-aware logging (4xx → `warn`, 5xx → `error`).
- **🗄️ Drizzle ORM** — PostgreSQL with migrations and auto-inferred types; sensitive columns are projected away at the data layer.
- **🧹 Biome** — lint + format in a single fast binary.
- **✅ Tests** — `bun:test`, no extra dependencies.

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
| **Lint/Format** | [Biome](https://biomejs.dev/)                         |
| **Tests**       | `bun:test`                                            |
| **Container**   | [Docker](https://www.docker.com/)                     |

## 📂 Project Structure

A feature-based (modular) architecture — code is grouped by domain for cohesion and scalability.

```
/
├── drizzle/                 # Drizzle Kit migration files
└── src/
    ├── index.ts             # App entry: middleware, router mount, AppType export
    ├── routes/              # Aggregates module routers under /api
    ├── modules/             # Core feature modules
    │   ├── auth/            # auth.route · auth.service · auth.schemas · auth.token.helper
    │   ├── health/          # Health check
    │   └── user/            # User feature
    ├── shared/
    │   ├── configs/         # environment (Zod-validated), database, logger
    │   ├── exceptions/      # ApiError hierarchy + global error handler
    │   ├── middlewares/     # auth (JWT), rate-limiter, validator (zValidator wrapper)
    │   ├── models/          # Drizzle-inferred types (User, NewUser, SafeUser)
    │   ├── repositories/    # Data access layer (Repository Pattern)
    │   └── utils/           # api-response, cookie-helper, ...
    └── types/               # Ambient typings (e.g. jwtPayload context variable)
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
docker compose up -d

# 5. Apply the schema
bun run db:push             # or: bun run db:generate && bun run db:migrate

# 6. Run the dev server (hot reload)
bun run dev
```

The server runs on `http://localhost:3000` (or your `PORT`).

## 🔑 Environment Variables

Validated at startup by [`src/shared/configs/environment`](src/shared/configs/environment/index.ts) — the app refuses to boot on misconfiguration.

| Variable                  | Default        | Description                                  |
| ------------------------- | -------------- | -------------------------------------------- |
| `POSTGRES_USER`           | —              | Database user (required)                     |
| `POSTGRES_PASSWORD`       | —              | Database password (required)                 |
| `POSTGRES_DB`             | —              | Database name (required)                     |
| `DB_HOST`                 | `localhost`    | Database host                                |
| `DB_PORT`                 | `5432`         | Database port                                |
| `JWT_SECRET`              | —              | Access-token secret (required)               |
| `JWT_EXPIRES_IN`          | `15m`          | Access-token lifetime                        |
| `JWT_REFRESH_SECRET`      | —              | Refresh-token secret (required)              |
| `JWT_REFRESH_EXPIRES_IN`  | `7d`           | Refresh-token lifetime                       |
| `JWT_REFRESH_COOKIE_NAME` | `refreshToken` | Refresh-token cookie name                    |
| `NODE_ENV`                | `development`  | `development` \| `production` \| `test`      |
| `CORS_ORIGIN`             | `*`            | Allowed CORS origin (set explicitly in prod) |
| `PORT`                    | `3000`         | Server port                                  |

## 📡 API Endpoints

| Method | Path                 | Auth | Description                            |
| ------ | -------------------- | ---- | -------------------------------------- |
| GET    | `/api/health`        | —    | Liveness probe                         |
| POST   | `/api/auth/register` | —    | Register a new user                    |
| POST   | `/api/auth/login`    | —    | Log in; sets refresh cookie            |
| POST   | `/api/auth/refresh`  | 🍪   | Rotate tokens using the refresh cookie |
| POST   | `/api/auth/logout`   | ✅   | Revoke the refresh token               |
| GET    | `/api/users/profile` | ✅   | Get the current user's profile         |

✅ = `Authorization: Bearer <accessToken>` · 🍪 = refresh-token cookie

## 🔐 Authentication

- **Passwords** are hashed with **argon2id** via `Bun.password`.
- **Access tokens** (short-lived) are returned in the JSON body; send them as `Authorization: Bearer <token>`.
- **Refresh tokens** (long-lived) live in an `HttpOnly`, `SameSite=Strict` cookie scoped to `/api/auth`. The server stores only a **full-length SHA-256 hash** of the token (no bcrypt 72-byte truncation).
- **Rotation + reuse-detection:** every `/refresh` issues a new token pair and stores the new hash. Presenting a stale (already-rotated) token revokes the stored token, forcing re-authentication.

## 🔗 Typed RPC Client

Because routes use chained, inline handlers, the app type is exported for the
[Hono RPC client](https://hono.dev/docs/guides/rpc):

```ts
import { hc } from "hono/client";
import type { AppType } from "./src";

const client = hc<AppType>("http://localhost:3000");

const res = await client.api.auth.login.$post({
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

```bash
bun test
```

Tests use `bun:test` (no extra dependencies). Services are unit-tested with an
in-memory fake repository, and the HTTP layer is exercised end-to-end via
`app.request()` — no running server or database required.

## 💅 Code Quality

This project uses **[Biome](https://biomejs.dev/)** for both linting and
formatting (replacing ESLint + Prettier with a single fast binary).

```bash
bun run lint       # check
bun run lint:fix   # autofix + format
```

> **VS Code:** install the [Biome extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) and enable "Format on Save".

## ☁️ Runtime Notes

Bun-native and runs on Node-like servers. For a true edge deployment (e.g.
Cloudflare Workers) a few runtime-bound pieces would need swapping:

- `Bun.password` (argon2id) and `getConnInfo` from `hono/bun` → a WASM hasher + the platform's conninfo helper.
- `postgres` (TCP) → an HTTP driver such as `drizzle-orm/neon-http`.
- `pino-pretty` transport (dev only) → a console logger.

The rate limiter uses an in-memory store (fine for a single instance). For
multi-instance / serverless, plug in a shared store such as Redis.

## ⚖️ License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.
