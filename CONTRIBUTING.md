# Contributing

Thanks for helping improve this template!

## Setup

```bash
bun install
cp .env.example .env       # then edit secrets
docker compose up -d       # start Postgres
bun run db:push            # apply the schema
bun run dev
```

## Before opening a PR

Run the same checks CI runs:

```bash
bun run lint        # Biome lint + format check
bun run typecheck   # tsc --noEmit
bun test            # unit + integration
```

A pre-commit hook (lefthook) runs lint + type-check automatically; it is
installed on `bun install` (or manually via `bunx lefthook install`).

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- **Formatting**: Biome (`bun run format`).
- **Tests**: unit tests live next to the code (`src/**/*.test.ts`); integration tests live in `tests/integration/`.

See the [README](README.md) for the full architecture overview.
