import { afterAll, mock } from "bun:test";
import { closeTestDb, migrateTestDb, testDb } from "./helpers/test-db";

/**
 * Global test preload (configured in bunfig.toml).
 *
 * 1. Migrates the in-memory PGlite database once for the whole run.
 * 2. Redirects the app's database singleton to it, so the real repositories
 *    run their actual SQL against PGlite — no live Postgres, full isolation.
 */
await migrateTestDb();

mock.module("@/shared/configs/database", () => ({
	db: testDb,
	closeDb: async () => {},
}));

// Release the in-memory database once the whole run finishes so the test
// process exits cleanly (an open PGlite handle makes Bun exit with code 99).
afterAll(async () => {
	await closeTestDb();
});
