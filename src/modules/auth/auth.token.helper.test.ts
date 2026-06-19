import { describe, expect, it } from "bun:test";
import { decode } from "hono/jwt";
import {
	generateAccessToken,
	generateRefreshToken,
	hashRefreshToken,
} from "@/modules/auth/auth.token.helper";

describe("auth token helper", () => {
	describe("generateAccessToken", () => {
		it("signs a JWT carrying sub, name, and role", async () => {
			const token = await generateAccessToken({
				sub: "1",
				name: "Ada",
				role: "admin",
			});
			expect(token.split(".")).toHaveLength(3);

			const { payload } = decode(token);
			expect(payload.sub).toBe("1");
			expect(payload.role).toBe("admin");
		});
	});

	describe("generateRefreshToken", () => {
		it("returns a 64-char hex (256-bit) token", () => {
			expect(generateRefreshToken()).toMatch(/^[0-9a-f]{64}$/);
		});

		it("is unique per call", () => {
			expect(generateRefreshToken()).not.toBe(generateRefreshToken());
		});
	});

	describe("hashRefreshToken", () => {
		it("produces a 64-char hex SHA-256 digest", async () => {
			expect(await hashRefreshToken("some.token")).toMatch(/^[0-9a-f]{64}$/);
		});

		it("hashes the full token, not just the first 72 bytes (the bcrypt bug)", async () => {
			const shared = "a".repeat(72);
			expect(await hashRefreshToken(`${shared}A`)).not.toBe(
				await hashRefreshToken(`${shared}B`),
			);
		});
	});
});
