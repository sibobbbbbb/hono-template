import { Context, Next } from "hono";
import { ZodType } from "zod";
import { BadRequestError } from "@/shared/exceptions/api-error";
import { formatZodError } from "@/shared/utils/zod-error-format-validation";

/**
 * A middleware factory for validating request body using Zod.
 * @param schema Zod schema to be used for validation.
 * @returns A Hono middleware.
 */
export const validate = (schema: ZodType) => {
  return async (c: Context, next: Next) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch (_error) {
      throw new BadRequestError("Invalid JSON body");
    }

    const result = schema.safeParse(body);

    if (!result.success) {
      const formattedError = formatZodError(result.error);
      throw new BadRequestError(formattedError);
    }

    c.set("validatedData", result.data);
    await next();
  };
};
