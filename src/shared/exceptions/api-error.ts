import type {
	ClientErrorStatusCode,
	ServerErrorStatusCode,
} from "hono/utils/http-status";

// Combined type for all possible error status codes we might use
type AppErrorStatusCode = ClientErrorStatusCode | ServerErrorStatusCode;

/**
 * Type for error payload, can be a simple string message
 * or a more complex object (for example, for validation errors).
 */
type ErrorPayload = string | Record<string, unknown>;

/**
 * Base class for all API errors that we can "catch" and format.
 *
 * Each error carries a stable, machine-readable `code` (e.g. `"NOT_FOUND"`) in
 * addition to the HTTP status, so clients can branch on it without parsing
 * human messages.
 */
export class ApiError extends Error {
	public readonly statusCode: AppErrorStatusCode;
	public readonly payload: ErrorPayload;
	public readonly code: string;

	constructor(
		payload: ErrorPayload,
		statusCode: AppErrorStatusCode,
		code: string,
	) {
		super(typeof payload === "string" ? payload : JSON.stringify(payload));
		this.payload = payload;
		this.statusCode = statusCode;
		this.code = code;
	}
}

// --- CLIENT ERROR (4xx) CLASSES ---

/** 400 Bad Request — e.g. invalid body / failed validation. */
export class BadRequestError extends ApiError {
	constructor(payload: ErrorPayload = "Bad Request") {
		super(payload, 400, "BAD_REQUEST");
	}
}

/** 401 Unauthorized — authentication missing or invalid. */
export class UnauthorizedError extends ApiError {
	constructor(payload: ErrorPayload = "Unauthorized") {
		super(payload, 401, "UNAUTHORIZED");
	}
}

/** 403 Forbidden — authenticated but not permitted. */
export class ForbiddenError extends ApiError {
	constructor(payload: ErrorPayload = "Forbidden") {
		super(payload, 403, "FORBIDDEN");
	}
}

/** 404 Not Found — the requested resource does not exist. */
export class NotFoundError extends ApiError {
	constructor(payload: ErrorPayload = "Not Found") {
		super(payload, 404, "NOT_FOUND");
	}
}

/** 409 Conflict — e.g. registering an already-used email. */
export class ConflictError extends ApiError {
	constructor(payload: ErrorPayload = "Conflict") {
		super(payload, 409, "CONFLICT");
	}
}

// --- SERVER ERROR (5xx) CLASSES ---

/** 500 Internal Server Error — unexpected server-side problem. */
export class InternalServerError extends ApiError {
	constructor(payload: ErrorPayload = "Internal Server Error") {
		super(payload, 500, "INTERNAL_SERVER_ERROR");
	}
}
