import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "@/shared/configs/logger";
import { ApiError } from "./api-error";

/**
 * Global error handler for the Hono application.
 *
 * Produces a standardized JSON envelope `{ success: false, code, message, ... }`
 * where `code` is a stable, machine-readable identifier. Logging is
 * severity-aware: 5xx at `error` (with stack), 4xx at `warn` (no stack).
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
		return c.json(
			{ success: false, code: "HTTP_EXCEPTION", message: err.message },
			err.status,
		);
	}

	if (err instanceof ApiError) {
		const base = { success: false, code: err.code };
		const body =
			typeof err.payload === "string"
				? { ...base, message: err.payload }
				: { ...base, ...err.payload };
		return c.json(body, err.statusCode);
	}

	return c.json(
		{
			success: false,
			code: "INTERNAL_SERVER_ERROR",
			message: "Internal Server Error",
		},
		500,
	);
};
