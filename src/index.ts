import { Hono } from "hono";
import { pinoLogger } from "hono-pino";
import { logger } from "@/shared/configs/logger";
import api from "@/routes";
import { errorHandler } from "@/shared/exceptions/error-handler";
import { secureHeaders } from "hono/secure-headers";
import { env } from "@/shared/configs/environment";


/**
 * @file Main application entry point.
 *
 * This file initializes the Hono application, sets up global middlewares
 * (like logger, secure headers), registers all API routes, defines the
 * global error handler, and starts the server.
 */

// Create a new Hono application instance
const app = new Hono();

// Middleware to set secure headers
app.use("*", secureHeaders());

// Middleware to log requests
app.use("*", pinoLogger({ pino: logger }));

// Register API routes
app.route("/api", api);

app.get("/", (c) => {
  return c.text("Welcome to Hono API!");
});

// Register global error handler
app.onError(errorHandler);

logger.info(`Server is running on http://localhost:${env.PORT}`);

export default {
  fetch: app.fetch,
  port: env.PORT,
};
