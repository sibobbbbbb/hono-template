import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/shared/configs/database/schema";

/**
 * A single in-memory PGlite database used when no DATABASE_URL is set.
 *
 * `tests/setup.ts` redirects the app's `@/shared/configs/database` module to
 * this instance, so the real repositories run their actual SQL against PGlite —
 * no live Postgres required. Production code is untouched.
 */
const client = new PGlite();

export const testDb = drizzle(client, { schema });

/** Applies the project's Drizzle migrations to the in-memory database. */
export const migrateTestDb = () =>
	migrate(testDb, { migrationsFolder: "./drizzle" });

/** Closes PGlite, releasing the resource so the test process exits cleanly. */
export const closeTestDb = () => client.close();

/**
 * Truncates all tables between tests. Resolves the *active* db at call time
 * (PGlite by default, or the real Postgres in the integration-postgres CI job).
 */
export const resetDb = async () => {
	const { db } = await import("@/shared/configs/database");
	await db.execute(
		sql`TRUNCATE TABLE sessions, users RESTART IDENTITY CASCADE`,
	);
};
