import { ClientErrorStatusCode, ServerErrorStatusCode } from 'hono/utils/http-status';

// Combined type for all possible error status codes we might use
type AppErrorStatusCode = ClientErrorStatusCode | ServerErrorStatusCode;



/**
 * Type for error payload, can be a simple string message
 * or a more complex object (for example, for validation errors).
 */
type ErrorPayload = string | Record<string, unknown>;

/**
 * Base class for all API errors that we can "catch" and format.
 * All specific errors will extend this class.
 */
export class ApiError extends Error {
  public readonly statusCode: AppErrorStatusCode;
  public readonly payload: ErrorPayload;

  constructor(payload: ErrorPayload, statusCode: AppErrorStatusCode) {
    super(typeof payload === 'string' ? payload : JSON.stringify(payload));
    this.payload = payload;
    this.statusCode = statusCode;
  }
}

// --- CLIENT ERROR (4xx) CLASSES ---

/**
 * 400 Bad Request
 * Used when the server cannot process the request due to incorrect syntax from the client side.
 * Example: Invalid JSON body.
 */
export class BadRequestError extends ApiError {
  constructor(payload: ErrorPayload = 'Bad Request') {
    super(payload, 400);
  }
}

/**
 * 401 Unauthorized
 * Used when the request requires authentication, but it's not provided or failed.
 * Example: JWT token is missing or invalid.
 */
export class UnauthorizedError extends ApiError {
  constructor(payload: ErrorPayload = 'Unauthorized') {
    super(payload, 401);
  }
}

/**
 * 403 Forbidden
 * Used when the server understands the request, but refuses to execute it.
 * User is authenticated, but doesn't have access permission.
 * Example: Regular user trying to access admin menu.
 */
export class ForbiddenError extends ApiError {
  constructor(payload: ErrorPayload = 'Forbidden') {
    super(payload, 403);
  }
}

/**
 * 404 Not Found
 * Used when the requested resource cannot be found on the server.
 * Example: Looking for a user with a non-existent ID.
 */
export class NotFoundError extends ApiError {
  constructor(payload: ErrorPayload = 'Not Found') {
    super(payload, 404);
  }
}

/**
 * 409 Conflict
 * Used when the request cannot be processed due to a conflict with the current state of the resource.
 * Example: Trying to register with an email that's already in use.
 */
export class ConflictError extends ApiError {
  constructor(payload: ErrorPayload = 'Conflict') {
    super(payload, 409);
  }
}

// --- SERVER ERROR (5xx) CLASSES ---

/**
 * 500 Internal Server Error
 * General error for unexpected problems on the server side.
 */
export class InternalServerError extends ApiError {
  constructor(payload: ErrorPayload = 'Internal Server Error') {
    super(payload, 500);
  }
}