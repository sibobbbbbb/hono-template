import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { formatZodError } from "@/shared/utils/zod-error-format-validation";

const schema = z.object({
	email: z.email(),
	password: z.string().min(8),
});

describe("formatZodError", () => {
	it("maps each failing field to its first message", () => {
		const result = schema.safeParse({ email: "not-an-email", password: "x" });
		expect(result.success).toBe(false);
		if (result.success) return;

		const formatted = formatZodError(result.error);

		expect(formatted.message).toBe("Validation failed");
		expect(typeof formatted.errors.email).toBe("string");
		expect(typeof formatted.errors.password).toBe("string");
	});

	it("accepts a valid payload without producing errors to format", () => {
		const result = schema.safeParse({
			email: "ada@example.com",
			password: "supersecret",
		});
		expect(result.success).toBe(true);
	});
});
