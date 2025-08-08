import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ApiError } from "./api-error";
import { logger } from "@/shared/configs/logger";

/**
 * Global error handler for the Hono application.
 *
 * It catches all thrown errors, logs them, and formats them into a
 * standardized JSON error response. It can handle custom `ApiError` types
 * as well as Hono's built-in `HTTPException`.
 *
 * @param err The error object.
 * @param c The Hono context.
 * @returns A formatted JSON response.
 */
export const errorHandler = (err: Error, c: Context) => {
  logger.error(
    {
      err: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      req: {
        method: c.req.method,
        url: c.req.url,
      },
    },
    'An error occurred'
  );

  if (err instanceof HTTPException) {
    return c.json({ success: false, message: err.message }, err.status);
  }

  if (err instanceof ApiError) {
    let responseBody: Record<string, unknown>;

    if (typeof err.payload === 'string') {
      responseBody = { success: false, message: err.payload };
    } else {
      responseBody = { success: false, ...err.payload };
    }
    
    return c.json(responseBody, err.statusCode);
  }

  return c.json({ success: false, message: "Internal Server Error" }, 500);
};
