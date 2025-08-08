import { ZodError, z } from "zod";

/**
 * Formats Zod validation errors into a structured object.
 *
 * This function takes a ZodError instance and converts it into a more
 * readable format, extracting the first error message for each field.
 *
 * @param error The ZodError instance to format.
 * @returns An object containing a message and an errors object with field-specific messages.
 */
export const formatZodError = (error: ZodError) => {
    const errorTree = z.treeifyError(error);
    const errorTreeAny = errorTree as Record<string, unknown>;

    const errors = Object.fromEntries(
        Object.keys(errorTreeAny).map((key) => {
        if (key !== '_errors') {
            const node = errorTreeAny[key] as { _errors?: string[] };
            return [
                key,
                node?._errors?.[0] ?? "Invalid value",
            ];
        }
            return [];
        }).filter(entry => entry.length > 0)
    );

    return {
        message: "Validation failed",
        errors,
    };
};