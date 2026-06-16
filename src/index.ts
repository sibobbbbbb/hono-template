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
	.route("/api", api)
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

if (import.meta.main) {
	logger.info(`Server is running on http://localhost:${env.PORT}`);

	const shutdown = async (signal: string) => {
		logger.info(`${signal} received — closing database and shutting down`);
		await closeDb();
		process.exit(0);
	};
	process.on("SIGTERM", () => void shutdown("SIGTERM"));
	process.on("SIGINT", () => void shutdown("SIGINT"));
}

/** Exported for tests (`app.request(...)`) and the Hono RPC client type. */
export { app };
export type AppType = typeof app;

export default {
	fetch: app.fetch,
	port: env.PORT,
};
