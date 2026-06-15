import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "@/shared/configs/logger";
import { ApiError } from "./api-error";

/**
 * Global error handler for the Hono application.
 *
 * Catches thrown errors and formats them into a standardized JSON response.
 * Logging is severity-aware: 5xx are real server faults (logged at `error`
 * with a stack trace), while 4xx are expected client errors (logged at `warn`
 * without the stack-trace noise) — preventing log spam and amplification.
 *
 * @param err The error object.
 * @param c The Hono context.
 */
export const errorHandler = (err: Error, c: Context) => {
	const status =
		err instanceof ApiError
			? err.statusCode
			: err instanceof HTTPException
				? err.status
				: 500;

	const requestInfo = { req: { method: c.req.method, url: c.req.url } };

	if (status >= 500) {
		logger.error(
			{
				err: { name: err.name, message: err.message, stack: err.stack },
				...requestInfo,
			},
			"Server error",
		);
	} else {
		logger.warn(
			{ err: { name: err.name, message: err.message }, ...requestInfo },
			"Client error",
		);
	}

	if (err instanceof HTTPException) {
		return c.json({ success: false, message: err.message }, err.status);
	}

	if (err instanceof ApiError) {
		const body =
			typeof err.payload === "string"
				? { success: false, message: err.payload }
				: { success: false, ...err.payload };
		return c.json(body, err.statusCode);
	}

	return c.json({ success: false, message: "Internal Server Error" }, 500);
};
