import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * Optional response metadata — most commonly pagination info, e.g.
 * `{ totalItems, totalPages, currentPage, itemsPerPage }`.
 */
interface Meta {
	[key: string]: unknown;
}

/**
 * Sends a standardized success response with the shape
 * `{ success: true, message, data, meta? }`.
 *
 * @template T Type of the `data` payload, for end-to-end type safety.
 * @param c Hono context.
 * @param statusCode HTTP status code (e.g. 200 OK, 201 Created).
 * @param message Human-readable description of the result.
 * @param data Payload to return. Optional, defaults to `null`.
 * @param meta Optional metadata such as pagination info.
 * @returns A JSON `Response`.
 */
export const sendSuccess = <T>(
	c: Context,
	statusCode: ContentfulStatusCode,
	message: string,
	data: T | null = null,
	meta?: Meta,
) => {
	const responseBody: {
		success: boolean;
		message: string;
		data: T | null;
		meta?: Meta;
	} = {
		success: true,
		message,
		data,
	};

	if (meta) {
		responseBody.meta = meta;
	}

	return c.json(responseBody, statusCode);
};
