import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { logger } from "@/shared/configs/logger";
import { reportError } from "@/shared/configs/observability/error-reporter";
import { ApiError } from "./api-error";

/**
 * Global error handler for the Hono application.
 *
 * Produces a standardized JSON envelope `{ success: false, code, message, ... }`
 * where `code` is a stable, machine-readable identifier. When a request id is
 * present it is echoed back (so clients can quote it) and attached to logs.
 * Logging is severity-aware: 5xx at `error` (with stack) plus a hook for an
 * external error reporter; 4xx at `warn` (no stack).
 */
export const errorHandler = (err: Error, c: Context) => {
	const status =
		err instanceof ApiError
			? err.statusCode
			: err instanceof HTTPException
				? err.status
				: 500;

	const requestId = c.get("requestId");
	const idField = requestId ? { requestId } : {};
	const requestInfo = {
		req: { method: c.req.method, url: c.req.url },
		requestId,
	};

	if (status >= 500) {
		logger.error(
			{
				err: { name: err.name, message: err.message, stack: err.stack },
				...requestInfo,
			},
			"Server error",
		);
		reportError(err, {
			requestId,
			method: c.req.method,
			url: c.req.url,
			statusCode: status,
		});
	} else {
		logger.warn(
			{ err: { name: err.name, message: err.message }, ...requestInfo },
			"Client error",
		);
	}

	if (err instanceof HTTPException) {
		return c.json(
			{
				success: false,
				code: "HTTP_EXCEPTION",
				message: err.message,
				...idField,
			},
			err.status,
		);
	}

	if (err instanceof ApiError) {
		const base = { success: false, code: err.code, ...idField };
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
			...idField,
		},
		500,
	);
};
