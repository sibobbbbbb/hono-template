import { describe, expect, it } from "bun:test";
import { parseJwtExpiresIn } from "@/shared/utils/parse-jwt-expires-in";

describe("parseJwtExpiresIn", () => {
	it("parses second/minute/hour/day units into seconds", () => {
		expect(parseJwtExpiresIn("30s")).toBe(30);
		expect(parseJwtExpiresIn("15m")).toBe(15 * 60);
		expect(parseJwtExpiresIn("1h")).toBe(60 * 60);
		expect(parseJwtExpiresIn("2d")).toBe(2 * 24 * 60 * 60);
	});

	it("falls back to 24h for an invalid duration", () => {
		expect(parseJwtExpiresIn("abc")).toBe(24 * 60 * 60);
	});

	it("treats a bare number as seconds", () => {
		expect(parseJwtExpiresIn("3600")).toBe(3600);
	});
});
