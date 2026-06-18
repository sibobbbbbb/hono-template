import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/shared/configs/database/schema";

/**
 * A single in-memory PGlite database shared across the test run.
 *
 * Integration tests talk to this through the real repositories: `tests/setup.ts`
 * redirects the `@/shared/configs/database` module to this instance, so no live
 * Postgres is required. Production code is untouched.
 */
const client = new PGlite();

export const testDb = drizzle(client, { schema });

/** Applies the project's Drizzle migrations to the in-memory database. */
export const migrateTestDb = () =>
	migrate(testDb, { migrationsFolder: "./drizzle" });

/** Truncates all tables and resets identities — call between tests. */
export const resetDb = async () => {
	await testDb.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
};

/** Closes the database, releasing the resource so the test process exits cleanly. */
export const closeTestDb = () => client.close();
