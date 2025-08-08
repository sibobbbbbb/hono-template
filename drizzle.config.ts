import { defineConfig } from "drizzle-kit";
import "dotenv/config";
import { env } from "./src/shared/configs/environment";

/**
 * @file Drizzle Kit configuration for database migrations.
 * @see https://orm.drizzle.team/kit-docs/config-reference
 *
 * This configuration specifies the database schema location, output directory for migrations,
 * and database credentials. It reads environment variables to securely connect to the database
 * for generating and applying migrations.
 */
export default defineConfig({
  schema: "./src/shared/configs/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: "localhost",
    port: env.DB_PORT,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
  },
});
