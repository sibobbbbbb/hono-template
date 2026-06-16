import { mock } from "bun:test";
import { migrateTestDb, testDb } from "./helpers/test-db";

/**
 * Global test preload (configured in bunfig.toml).
 *
 * 1. Migrates the in-memory PGlite database once for the whole run.
 * 2. Redirects the app's database singleton to it, so the real repositories
 *    run their actual SQL against PGlite — no live Postgres, full isolation.
 */
await migrateTestDb();

mock.module("@/shared/configs/database", () => ({ db: testDb }));
