import { beforeEach, describe, expect, it } from "bun:test";
import {
	authHeaders,
	login,
	register,
	registerAndLogin,
	TEST_USER,
	uniqueIp,
} from "@tests/helpers/auth";
import { resetDb } from "@tests/helpers/test-db";
import { eq } from "drizzle-orm";
import { app } from "@/index";
import { hashRefreshToken } from "@/modules/auth/auth.token.helper";
import { db } from "@/shared/configs/database";
import { sessionsTable, usersTable } from "@/shared/configs/database/schema";

const findUser = (email: string) =>
	db.query.usersTable.findFirst({ where: eq(usersTable.email, email) });

const findSessionByRawToken = async (rawToken: string) =>
	db.query.sessionsTable.findFirst({
		where: eq(sessionsTable.tokenHash, await hashRefreshToken(rawToken)),
	});

const rawFromCookie = (cookie: string) => cookie.slice("refreshToken=".length);

beforeEach(resetDb);

describe("auth flow (integration · PGlite)", () => {
	describe("register", () => {
		it("creates a user with a hashed password and the default role", async () => {
			const res = await register(app);
			expect(res.status).toBe(201);

			const body = (await res.json()) as {
				data: { email: string; role: string; password?: string };
			};
			expect(body.data.email).toBe(TEST_USER.email);
			expect(body.data.role).toBe("user");
			expect(body.data.password).toBeUndefined();

			const stored = await findUser(TEST_USER.email);
			expect(
				await Bun.password.verify(TEST_USER.password, stored?.password ?? ""),
			).toBe(true);
		});

		it("rejects a duplicate email with 409", async () => {
			await register(app);
			expect((await register(app)).status).toBe(409);
		});
	});

	describe("login", () => {
		beforeEach(async () => {
			await register(app);
		});

		it("sets an HttpOnly refresh cookie and creates a session row", async () => {
			const { res, accessToken, refreshCookie } = await login(app);
			expect(res.status).toBe(200);
			expect(typeof accessToken).toBe("string");

			const setCookie = res.headers.get("set-cookie") ?? "";
			expect(setCookie).toContain("HttpOnly");
			expect(setCookie).toContain("Path=/api/auth");

			const session = await findSessionByRawToken(rawFromCookie(refreshCookie));
			expect(session).toBeDefined();
		});

		it("rejects wrong credentials with 401", async () => {
			const { res } = await login(app, {
				email: TEST_USER.email,
				password: "wrong-password",
			});
			expect(res.status).toBe(401);
		});
	});

	describe("profile", () => {
		it("returns the current user (including role) with a valid token", async () => {
			const { accessToken } = await registerAndLogin(app);
			const res = await app.request("/api/users/profile", {
				headers: authHeaders(accessToken ?? ""),
			});
			expect(res.status).toBe(200);

			const body = (await res.json()) as {
				data: { email: string; role: string };
			};
			expect(body.data.email).toBe(TEST_USER.email);
			expect(body.data.role).toBe("user");
		});

		it("rejects a missing token with 401", async () => {
			const res = await app.request("/api/users/profile", {
				headers: { "x-forwarded-for": uniqueIp() },
			});
			expect(res.status).toBe(401);
		});
	});

	describe("refresh + logout", () => {
		it("rotates tokens and denies reuse of the old refresh cookie", async () => {
			const { refreshCookie } = await registerAndLogin(app);

			const first = await app.request("/api/auth/refresh", {
				method: "POST",
				headers: { cookie: refreshCookie, "x-forwarded-for": uniqueIp() },
			});
			expect(first.status).toBe(200);

			const rotated =
				(first.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
			expect(rotated).not.toBe(refreshCookie);

			// The original (rotated-away) cookie is now dead.
			const reuse = await app.request("/api/auth/refresh", {
				method: "POST",
				headers: { cookie: refreshCookie, "x-forwarded-for": uniqueIp() },
			});
			expect(reuse.status).toBe(403);

			// The rotated cookie still works.
			const ok = await app.request("/api/auth/refresh", {
				method: "POST",
				headers: { cookie: rotated, "x-forwarded-for": uniqueIp() },
			});
			expect(ok.status).toBe(200);
		});

		it("logout revokes the session, killing the refresh cookie", async () => {
			const { accessToken, refreshCookie } = await registerAndLogin(app);

			const res = await app.request("/api/auth/logout", {
				method: "POST",
				headers: { ...authHeaders(accessToken ?? ""), cookie: refreshCookie },
			});
			expect(res.status).toBe(200);

			const after = await app.request("/api/auth/refresh", {
				method: "POST",
				headers: { cookie: refreshCookie, "x-forwarded-for": uniqueIp() },
			});
			expect(after.status).toBe(403);
		});
	});
});
