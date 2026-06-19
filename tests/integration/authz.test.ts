import { beforeEach, describe, expect, it } from "bun:test";
import { authHeaders, login, registerAndLogin } from "@tests/helpers/auth";
import { resetDb } from "@tests/helpers/test-db";
import { app } from "@/index";
import { db } from "@/shared/configs/database";
import { usersTable } from "@/shared/configs/database/schema";

beforeEach(resetDb);

describe("authorization (requireRole · /api/users)", () => {
	it("denies a regular user from the admin-only route with 403", async () => {
		const { accessToken } = await registerAndLogin(app);
		const res = await app.request("/api/users", {
			headers: authHeaders(accessToken ?? ""),
		});
		expect(res.status).toBe(403);
	});

	it("allows an admin to list users", async () => {
		const password = await Bun.password.hash("supersecret", {
			algorithm: "argon2id",
		});
		await db.insert(usersTable).values({
			name: "Root",
			email: "root@example.com",
			password,
			role: "admin",
		});

		const { accessToken } = await login(app, {
			email: "root@example.com",
			password: "supersecret",
		});
		const res = await app.request("/api/users", {
			headers: authHeaders(accessToken ?? ""),
		});
		expect(res.status).toBe(200);

		const body = (await res.json()) as { data: unknown[] };
		expect(Array.isArray(body.data)).toBe(true);
		expect(body.data.length).toBeGreaterThan(0);
	});
});
