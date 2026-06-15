import { describe, expect, it } from "bun:test";
import { app } from "@/index";

/**
 * Integration tests that exercise the full middleware pipeline via
 * `app.request()` — no running server and no database required (these paths
 * resolve before any DB query). The `x-forwarded-for` header lets the rate
 * limiter derive a key without a live connection.
 */
describe("app", () => {
	it("GET /api/health returns a healthy status", async () => {
		const res = await app.request("/api/health");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			status: "ok",
			message: "API is healthy!",
		});
	});

	it("POST /api/auth/register with an invalid body returns a 400 validation envelope", async () => {
		const res = await app.request("/api/auth/register", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-forwarded-for": "127.0.0.1",
			},
			body: JSON.stringify({ email: "not-an-email", password: "short" }),
		});

		expect(res.status).toBe(400);
		const body = (await res.json()) as { success: boolean; message: string };
		expect(body.success).toBe(false);
		expect(body.message).toBe("Validation failed");
	});
});
