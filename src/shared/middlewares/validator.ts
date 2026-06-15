import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";
import { BadRequestError } from "@/shared/exceptions/api-error";
import { formatZodError } from "@/shared/utils/zod-error-format-validation";

/**
 * A thin wrapper around `@hono/zod-validator` for JSON bodies.
 *
 * It funnels validation failures into our centralized `ApiError` pipeline
 * (so every 400 shares the same response envelope) while preserving full
 * type inference at the handler via `c.req.valid("json")` — no `as` casts.
 *
 * @param schema The Zod schema to validate the JSON body against.
 */
export const jsonValidator = <T extends ZodType>(schema: T) =>
	zValidator("json", schema, (result) => {
		if (!result.success) {
			throw new BadRequestError(formatZodError(result.error));
		}
	});
