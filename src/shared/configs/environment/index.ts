import "dotenv/config";
import { z } from "zod";

/**
 * @file Environment variable validation using Zod.
 *
 * This file defines a schema for all required environment variables.
 * It parses and validates `process.env` on application startup. If any
 * variable is missing or has an incorrect type, the application will
 * throw an error and exit, preventing runtime errors due to misconfiguration.
 */
const envSchema = z.object({
	// Database Credentials
	POSTGRES_USER: z
		.string()
		.min(1, { message: "POSTGRES_USER cannot be empty" }),
	POSTGRES_PASSWORD: z
		.string()
		.min(1, { message: "POSTGRES_PASSWORD cannot be empty" }),
	POSTGRES_DB: z.string().min(1, { message: "POSTGRES_DB cannot be empty" }),
	DB_PORT: z.coerce.number().default(5432),
	DB_HOST: z.string().default("localhost"),
	// Optional single connection string; overrides the individual vars above.
	DATABASE_URL: z.string().optional(),
	// SSL is required by most managed Postgres (Neon/Supabase/RDS).
	DB_SSL: z
		.string()
		.default("false")
		.transform((v) => v === "true" || v === "1"),
	DB_POOL_MAX: z.coerce.number().int().positive().default(10),

	// JWT Credentials
	JWT_SECRET: z.string().min(1, { message: "JWT_SECRET cannot be empty" }),
	JWT_EXPIRES_IN: z.string().default("15m"),

	// JWT Refresh Credentials
	JWT_REFRESH_SECRET: z
		.string()
		.min(1, { message: "JWT_REFRESH_SECRET cannot be empty" }),
	JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
	JWT_REFRESH_COOKIE_NAME: z.string().default("refreshToken"),

	// Optional Redis connection string. When set, rate-limit counters are stored
	// in Redis (consistent across instances) instead of per-process memory.
	REDIS_URL: z.string().optional(),

	// Observability (OpenTelemetry) — opt-in tracing. Install the @opentelemetry/*
	// packages, then set OTEL_ENABLED=true and OTEL_EXPORTER_OTLP_ENDPOINT.
	OTEL_ENABLED: z
		.string()
		.default("false")
		.transform((v) => v === "true" || v === "1"),
	OTEL_SERVICE_NAME: z.string().default("hono-api"),

	// App Environment
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),

	// CORS — a single origin or '*'. In production, set an explicit origin when
	// using credentials (cookies); browsers reject credentialed '*' responses.
	CORS_ORIGIN: z.string().default("*"),

	// Server Configuration
	PORT: z.coerce.number().default(3000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
	console.error(
		"❌ Invalid environment configuration:",
		z.treeifyError(parsedEnv.error),
	);
	throw new Error(
		"Invalid environment configuration. Please check your .env file.",
	);
}

export const env = parsedEnv.data;
