import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/shared/configs/environment";
import * as schema from "./schema";

/**
 * Database connection (Drizzle ORM + postgres-js).
 *
 * Accepts either a single `DATABASE_URL` (recommended for managed/cloud
 * Postgres) or the individual `POSTGRES_*` / `DB_*` variables. SSL and pool
 * size are configurable — enable `DB_SSL` for managed providers
 * (Neon / Supabase / RDS).
 */
const connectionOptions = {
	max: env.DB_POOL_MAX,
	idle_timeout: 20,
	connect_timeout: 10,
	ssl: env.DB_SSL ? ("require" as const) : false,
};

const client = env.DATABASE_URL
	? postgres(env.DATABASE_URL, connectionOptions)
	: postgres({
			host: env.DB_HOST,
			port: env.DB_PORT,
			user: env.POSTGRES_USER,
			password: env.POSTGRES_PASSWORD,
			database: env.POSTGRES_DB,
			...connectionOptions,
		});

export const db = drizzle(client, { schema });

/** Closes the connection pool — used for graceful shutdown. */
export const closeDb = () => client.end({ timeout: 5 });
