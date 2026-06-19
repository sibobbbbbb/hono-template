import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { openAPIRouteHandler } from "hono-openapi";
import { pinoLogger } from "hono-pino";
import api from "@/routes";
import { closeDb } from "@/shared/configs/database";
import { env } from "@/shared/configs/environment";
import { logger } from "@/shared/configs/logger";
import { initTracing } from "@/shared/configs/observability/tracing";
import { errorHandler } from "@/shared/exceptions/error-handler";

/**
 * @file Main application entry point.
 *
 * Initializes the Hono app, registers global middleware (request id, secure
 * headers, CORS, body limit, logging), mounts the API router, serves the
 * OpenAPI spec + docs, sets the global error handler, and exports a
 * WinterCG-style fetch server for Bun. When run directly it also wires up
 * graceful shutdown.
 */

// "*" cannot be combined with credentials, so only enable credentials for an
// explicit origin (or a comma-separated allow-list).
const corsOrigin =
	env.CORS_ORIGIN === "*"
		? "*"
		: env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

const app = new Hono()
	.use("*", requestId())
	.use("*", secureHeaders())
	.use("*", cors({ origin: corsOrigin, credentials: env.CORS_ORIGIN !== "*" }))
	.use("*", bodyLimit({ maxSize: 100 * 1024 })) // 100 KB request-body cap
	.use("*", pinoLogger({ pino: logger }))
	.route("/api/v1", api)
	.get("/", (c) => c.text("Welcome to Hono API!"));

// OpenAPI spec (generated from describeRoute annotations) + Scalar docs UI.
app.get(
	"/openapi",
	openAPIRouteHandler(app, {
		documentation: {
			info: {
				title: "Hono API Template",
				version: "1.0.0",
				description: "An ultrafast, type-safe Hono + Bun API template.",
			},
			servers: [{ url: `http://localhost:${env.PORT}`, description: "Local" }],
			components: {
				securitySchemes: {
					bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
				},
			},
		},
	}),
);
app.get("/docs", Scalar({ url: "/openapi", pageTitle: "Hono API Template" }));

app.onError(errorHandler);

/** Exported for tests (`app.request(...)`) and the Hono RPC client type. */
export { app };
export type AppType = typeof app;

// Serve only when run directly (not when imported by tests). An explicit
// Bun.serve lets our signal handlers run for graceful shutdown — Bun's
// auto-serve of a `default` export intercepts SIGTERM itself.
if (import.meta.main) {
	// Optional, gated by OTEL_ENABLED — safe no-op otherwise.
	await initTracing();

	const server = Bun.serve({ fetch: app.fetch, port: env.PORT });
	logger.info(`Server running at ${server.url}`);

	const shutdown = async (signal: string) => {
		logger.info(`${signal} received — shutting down gracefully`);
		await server.stop(true);
		await closeDb();
		process.exit(0);
	};
	process.on("SIGTERM", () => void shutdown("SIGTERM"));
	process.on("SIGINT", () => void shutdown("SIGINT"));
}
