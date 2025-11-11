# Hono API Template

<p align="center">
    <img src="https://raw.githubusercontent.com/honojs/hono/main/docs/images/hono-logo.png" alt="Hono Logo" width="150">
</p>

<p align="center">
    <strong>A robust, scalable, and production-ready backend template built with Hono, Drizzle ORM, and PostgreSQL.</strong>
</p>

<p align="center">
    <a href="#"><img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-blue.svg"></a>
    <a href="#"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-blue.svg"></a>
    <a href="#"><img alt="Bun" src="https://img.shields.io/badge/Bun-1.x-black?logo=bun&logoColor=white"></a>
</p>

---

This template provides a solid foundation for building modern, high-performance APIs. It comes with a complete authentication system, secure best practices, and a clean, modular architecture that's easy to extend.

## ✨ Features

- **🚀 Modern Tech Stack**: [Hono](https://hono.dev/) for the web framework and [Drizzle ORM](https://orm.drizzle.team/) for the database layer
- **🔐 Full Authentication Flow**: Secure JWT-based authentication with Access Tokens and Refresh Tokens
- **🛡️ Secure by Default**:
    - Refresh Tokens are stored in secure `HttpOnly` cookies
    - Hashing of refresh tokens in the database
    - `secureHeaders` middleware for HTTP security headers
    - Rate limiting for sensitive endpoints
- **🏗️ Modular Architecture**: Feature-based structure for high cohesion and scalability
- **🗄️ Database Ready**: PostgreSQL setup with Docker and migrations handled by Drizzle Kit
- **🔒 Type Safety**: End-to-end type safety with TypeScript and Drizzle's auto-inferred types
- **⚙️ Configuration Management**: Environment variable validation with Zod
- **⚡ Robust Error Handling**: Standardized error responses and a global error handler
- **👨‍💻 Developer Experience**:
    - `pino-pretty` for readable logs in development
    - Path aliases (`@/*`) for clean imports
    - Detailed JSDoc comments across the codebase

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Hono](https://hono.dev/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Runtime** | [Bun](https://bun.sh/) |
| **Environment** | [Dotenv](https://github.com/motdotla/dotenv), [Zod](https://zod.dev/) |
| **Containerization** | [Docker](https://www.docker.com/) |

## 📂 Project Structure

This project uses a feature-based (or modular) architecture. The goal is to group code by its domain or feature, making the codebase easier to navigate, maintain, and scale.

```
/
├── drizzle/              # Drizzle Kit migration files
└── src/
    ├── container/        # Dependency Injection container
    ├── modules/          # Core feature modules (e.g., auth, users)
    │   ├── auth/         # Authentication feature
    │   ├── health/       # Health check feature
    │   └── user/         # User feature
    ├── routes/           # Main API router to aggregate all modules
    ├── shared/           # Code shared across modules
    │   ├── configs/      # Application configurations (db, logger, env)
    │   ├── exceptions/   # Custom error classes and global handler
    │   ├── middlewares/  # Middleware functions (e.g., auth, rate limiting)
    │   ├── models/       # Database model types (inferred from Drizzle)
    │   ├── repositories/ # Data access layer (Repository Pattern)
    │   └── utils/        # Utility and helper functions
    └── index.ts          # Main application entry point
```

---

## 🚀 Getting Started

Follow these steps to get the project up and running on your local machine.

### Prerequisites

- [Bun](https://bun.sh/) (v1.x)
- [Docker](https://www.docker.com/) and Docker Compose

### 1. Clone the Repository

```bash
git clone https://github.com/sibobbbbbb/hono-template.git
cd hono-template
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root of the project by copying the example file.

```bash
cp .env.example .env
```

The `.env` file requires the following variables:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `POSTGRES_USER` | PostgreSQL database username | `hono` |
| `POSTGRES_PASSWORD` | PostgreSQL database password | `honopassword` |
| `POSTGRES_DB` | PostgreSQL database name | `honodb` |
| `DB_PORT` | Port for the database connection | `5432` |
| `JWT_SECRET` | Secret key for signing Access Tokens | `..._secret` |
| `JWT_EXPIRES_IN` | Expiration time for Access Tokens (e.g., 15m) | `15m` |
| `JWT_REFRESH_SECRET` | Secret key for signing Refresh Tokens | `..._secret` |
| `JWT_REFRESH_EXPIRES_IN` | Expiration time for Refresh Tokens (e.g., 7d) | `7d` |
| `JWT_REFRESH_COOKIE_NAME` | Name of the cookie storing the refresh token | `refreshToken` |
| `NODE_ENV` | Application environment | `development` |
| `PORT` | Port on which the server will run | `3000` |

### 4. Start the Database

Run the PostgreSQL database using Docker Compose.

```bash
docker compose up -d
```

This command will start a PostgreSQL container in the background.

### 5. Run Database Migrations

Apply the database schema to your newly created database.

```bash
bun run db:migrate
```

This command executes the SQL migration files located in the `/drizzle` directory.

### 6. Run the Application

Start the development server with hot-reloading.

```bash
bun run dev
```

The server will be running on http://localhost:3000 (or the PORT you specify in your .env file)

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Starts the application in development mode with hot-reloading using tsx |
| `bun run build` | Compiles the TypeScript code to JavaScript in the `/dist` directory |
| `bun run start` | Starts the compiled application from the `/dist` directory (for production) |
| `bun run db:generate` | Generates a new SQL migration file based on changes in your schema |
| `bun run db:migrate` | Applies all pending migrations to the database |
| `bun run db:push` | Pushes schema changes directly to the database without creating a migration file |

> **Note**: `bun run db:push` is for rapid prototyping only. Not recommended for production.

## 💅 Code Quality & Formatting

This project is configured with **ESLint** and **Prettier** to ensure high code quality and a consistent coding style.

- **ESLint**: Linter for identifying and fixing problems in your TypeScript code.
- **Prettier**: An opinionated code formatter to maintain a consistent style.

You can use the following scripts to manage your code's quality:

| Script | Description |
|---|---|
| `bun run lint` | Lints all TypeScript files in the `src` directory and reports issues. |
| `bun run lint:fix` | Automatically fixes all auto-fixable linting issues. |
| `bun run format` | Formats all TypeScript files in the `src` directory using Prettier. |

### Recommended VS Code Extensions

For the best developer experience, it's recommended to install the following VS Code extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

After installation, you can enable "Format on Save" in your editor settings to automatically format your code every time you save a file.

## ⚖️ License

This project is licensed under the ISC License. See the LICENSE file for details.