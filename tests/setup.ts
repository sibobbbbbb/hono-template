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
} else {
	// Real-Postgres mode (CI): nothing is mocked, so close the app's own
	// connection pool after the suite — otherwise Bun exits with code 99
	// ("dangling resource"). Imported dynamically so the real db module is not
	// loaded in PGlite mode (where it would be replaced by mock.module above).
	const { closeDb } = await import("@/shared/configs/database");

	afterAll(async () => {
		await closeDb();
		// Importing test-db above eagerly constructs a PGlite instance even in
		// this mode; close it too so it is not left dangling at exit.
		await closeTestDb();
	});
}
