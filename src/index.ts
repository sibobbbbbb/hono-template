import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { pinoLogger } from "hono-pino";
import api from "@/routes";
import { env } from "@/shared/configs/environment";
import { logger } from "@/shared/configs/logger";
import { errorHandler } from "@/shared/exceptions/error-handler";

/**
 * @file Main application entry point.
 *
 * Initializes the Hono app, registers global middleware (request id, secure
 * headers, CORS, body limit, logging), mounts the API router, sets the global
 * error handler, and exports a WinterCG-style fetch server for Bun.
 */
const app = new Hono()
	.use("*", requestId())
	.use("*", secureHeaders())
	.use("*", cors({ origin: env.CORS_ORIGIN, credentials: true }))
	.use("*", bodyLimit({ maxSize: 100 * 1024 })) // 100 KB request-body cap
	.use("*", pinoLogger({ pino: logger }))
	.route("/api", api)
	.get("/", (c) => c.text("Welcome to Hono API!"));

app.onError(errorHandler);

if (import.meta.main) {
	logger.info(`Server is running on http://localhost:${env.PORT}`);
}

/** Exported for tests (`app.request(...)`) and the Hono RPC client type. */
export { app };
export type AppType = typeof app;

export default {
	fetch: app.fetch,
	port: env.PORT,
};
