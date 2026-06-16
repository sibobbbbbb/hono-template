import { beforeEach, describe, expect, it } from "bun:test";
import { resetDb } from "@tests/helpers/test-db";
import { app } from "@/index";

beforeEach(resetDb);

describe("http layer (integration)", () => {
	it("GET /api/health -> 200 healthy payload", async () => {
		const res = await app.request("/api/health");
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			status: "ok",
			message: "API is healthy!",
		});
	});

	it("GET / -> 200 welcome text", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);
		expect(await res.text()).toContain("Welcome");
	});

	it("unknown route -> 404", async () => {
		const res = await app.request("/api/does-not-exist");
		expect(res.status).toBe(404);
	});

	it("invalid body -> 400 validation envelope", async () => {
		const res = await app.request("/api/auth/register", {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-forwarded-for": "10.9.9.9",
			},
			body: JSON.stringify({ email: "bad", password: "x" }),
		});
		expect(res.status).toBe(400);

		const body = (await res.json()) as {
			success: boolean;
			message: string;
			errors?: Record<string, string>;
		};
		expect(body.success).toBe(false);
		expect(body.message).toBe("Validation failed");
		expect(typeof body.errors?.email).toBe("string");
	});

	it("protected route without a token -> 401", async () => {
		const res = await app.request("/api/users/profile", {
			headers: { "x-forwarded-for": "10.9.9.8" },
		});
		expect(res.status).toBe(401);
		const body = (await res.json()) as { success: boolean };
		expect(body.success).toBe(false);
	});

	it("sets security headers (secureHeaders middleware)", async () => {
		const res = await app.request("/api/health");
		expect(res.headers.get("x-content-type-options")).toBe("nosniff");
	});

	it("rate-limits sensitive endpoints after the configured limit", async () => {
		const ip = "203.0.113.7"; // fixed IP -> a dedicated, shared bucket
		const statuses: number[] = [];
		for (let i = 0; i < 6; i++) {
			const res = await app.request("/api/auth/login", {
				method: "POST",
				headers: { "content-type": "application/json", "x-forwarded-for": ip },
				body: JSON.stringify({
					email: "nobody@example.com",
					password: "whatever",
				}),
			});
			statuses.push(res.status);
		}
		// First 5 are normal failures (401); the 6th exceeds the limit (429).
		expect(statuses).toContain(429);
	});
});
