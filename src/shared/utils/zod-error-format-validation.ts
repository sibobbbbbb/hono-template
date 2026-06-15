import { z } from "zod";
import type { $ZodError } from "zod/v4/core";

/**
 * Formats a Zod validation error into a flat `{ field: message }` object.
 *
 * Uses Zod v4's `flattenError`, which returns `fieldErrors` keyed by field
 * name; we surface the first message per field for a concise API response.
 *
 * @param error The Zod error produced by a failed `safeParse`.
 * @returns `{ message, errors }` where `errors` maps each field to its first message.
 */
export const formatZodError = <T>(error: $ZodError<T>) => {
	const { fieldErrors } = z.flattenError(error);

	const errors: Record<string, string> = {};
	for (const [field, messages] of Object.entries(fieldErrors)) {
		const list = messages as string[] | undefined;
		errors[field] = list?.[0] ?? "Invalid value";
	}

	return {
		message: "Validation failed",
		errors,
	};
};
