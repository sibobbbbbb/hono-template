import { describe, expect, it } from "bun:test";
import { hashRefreshToken } from "@/modules/auth/auth.token.helper";

describe("hashRefreshToken", () => {
	it("produces a 64-char hex SHA-256 digest", async () => {
		const hash = await hashRefreshToken("some.refresh.token");
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it("is deterministic for the same input", async () => {
		expect(await hashRefreshToken("abc")).toBe(await hashRefreshToken("abc"));
	});

	it("hashes the full token, not just the first 72 bytes (the bcrypt bug)", async () => {
		const sharedPrefix = "a".repeat(72);
		const hashA = await hashRefreshToken(`${sharedPrefix}TAIL-A`);
		const hashB = await hashRefreshToken(`${sharedPrefix}TAIL-B`);
		expect(hashA).not.toBe(hashB);
	});
});
