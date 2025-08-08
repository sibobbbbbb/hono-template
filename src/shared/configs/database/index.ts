import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/shared/configs/environment";
import * as schema from "./schema";

/**
 * Database connection configuration using Drizzle ORM.
 *
 * This file initializes the database connection using the Postgres client
 * and the schema defined in `./schema.ts`. It exports the `db` instance for
 * use throughout the application.
 *
 * @see https://orm.drizzle.team/kit-docs/config-reference
 */

// Create a Postgres client
const client = postgres({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
});

// Initialize the database connection with the schema
export const db = drizzle(client, { schema });
