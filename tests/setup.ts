import { afterAll, mock } from "bun:test";
import { closeTestDb, migrateTestDb, testDb } from "./helpers/test-db";

/**
 * Global test preload (configured in bunfig.toml).
 *
 * Default (no DATABASE_URL): migrate an in-memory PGlite database once and
 * redirect the app's db to it — fast, no external Postgres. When DATABASE_URL
 * is set (the CI "integration-postgres" job), the mock is skipped so the same
 * tests run against a real Postgres instead.
 */
if (!process.env.DATABASE_URL) {
	await migrateTestDb();

	mock.module("@/shared/configs/database", () => ({
		db: testDb,
		closeDb: async () => {},
	}));

	afterAll(async () => {
		await closeTestDb();
	});
}
