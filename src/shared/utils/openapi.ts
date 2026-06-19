import type { DescribeRouteOptions } from "hono-openapi";
import { type ZodType, z } from "zod";

/**
 * Builds an OpenAPI `requestBody` for a JSON body, derived from a Zod schema
 * via `z.toJSONSchema`. This keeps the documented request body in sync with the
 * schema used for validation, without hand-writing JSON Schema.
 *
 * @example
 * describeRoute({ requestBody: jsonBody(RegisterRequestSchema), ... })
 */
export const jsonBody = (schema: ZodType) =>
	({
		content: {
			"application/json": { schema: z.toJSONSchema(schema) },
		},
	}) as unknown as DescribeRouteOptions["requestBody"];
