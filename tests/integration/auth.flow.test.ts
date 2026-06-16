import { beforeEach, describe, expect, it } from "bun:test";
import {
	authHeaders,
	login,
	register,
	registerAndLogin,
	TEST_USER,
	uniqueIp,
} from "@tests/helpers/auth";
import { resetDb, testDb } from "@tests/helpers/test-db";
import { eq } from "drizzle-orm";
import { app } from "@/index";
import { hashRefreshToken } from "@/modules/auth/auth.token.helper";
import { usersTable } from "@/shared/configs/database/schema";

const findUser = (email: string) =>
	testDb.query.usersTable.findFirst({ where: eq(usersTable.email, email) });

beforeEach(resetDb);

describe("auth flow (integration · PGlite)", () => {
	describe("register", () => {
		it("creates a user with a hashed password and returns a safe body", async () => {
			const res = await register(app);
			expect(res.status).toBe(201);

			const body = (await res.json()) as {
				data: { email: string; password?: string };
			};
			expect(body.data.email).toBe(TEST_USER.email);
			expect(body.data.password).toBeUndefined();

			const stored = await findUser(TEST_USER.email);
			expect(stored?.password).not.toBe(TEST_USER.password);
			expect(
				await Bun.password.verify(TEST_USER.password, stored?.password ?? ""),
			).toBe(true);
		});

		it("rejects a duplicate email with 409", async () => {
			await register(app);
			const res = await register(app);
			expect(res.status).toBe(409);
		});
	});

	describe("login", () => {
		beforeEach(async () => {
			await register(app);
		});

		it("returns an access token, sets an HttpOnly refresh cookie, and stores its hash", async () => {
			const { res, accessToken, refreshCookie } = await login(app);
			expect(res.status).toBe(200);
			expect(typeof accessToken).toBe("string");

			const setCookie = res.headers.get("set-cookie") ?? "";
			expect(setCookie).toContain("HttpOnly");
			expect(setCookie).toContain("Path=/api/auth");
			expect(refreshCookie.startsWith("refreshToken=")).toBe(true);

			const rawToken = refreshCookie.slice("refreshToken=".length);
			const stored = await findUser(TEST_USER.email);
			expect(stored?.refreshToken).toBe(await hashRefreshToken(rawToken));
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
		it("returns the current user with a valid access token", async () => {
			const { accessToken } = await registerAndLogin(app);
			const res = await app.request("/api/users/profile", {
				headers: authHeaders(accessToken ?? ""),
			});
			expect(res.status).toBe(200);

			const body = (await res.json()) as {
				data: { email: string; password?: string };
			};
			expect(body.data.email).toBe(TEST_USER.email);
			expect(body.data.password).toBeUndefined();
		});

		it("rejects a missing token with 401", async () => {
			const res = await app.request("/api/users/profile", {
				headers: { "x-forwarded-for": uniqueIp() },
			});
			expect(res.status).toBe(401);
		});
	});

	describe("refresh + logout", () => {
		it("rotates tokens and then denies reuse of the old refresh cookie", async () => {
			const { refreshCookie } = await registerAndLogin(app);

			const first = await app.request("/api/auth/refresh", {
				method: "POST",
				headers: { cookie: refreshCookie, "x-forwarded-for": uniqueIp() },
			});
			expect(first.status).toBe(200);
			const firstBody = (await first.json()) as {
				data: { accessToken: string };
			};
			expect(typeof firstBody.data.accessToken).toBe("string");

			const rotatedCookie =
				(first.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
			expect(rotatedCookie).not.toBe(refreshCookie);

			// Reusing the original (now-rotated) cookie must be denied...
			const reuse = await app.request("/api/auth/refresh", {
				method: "POST",
				headers: { cookie: refreshCookie, "x-forwarded-for": uniqueIp() },
			});
			expect(reuse.status).toBe(403);

			// ...and that reuse revokes the stored token, so even the rotated cookie fails.
			const afterRevoke = await app.request("/api/auth/refresh", {
				method: "POST",
				headers: { cookie: rotatedCookie, "x-forwarded-for": uniqueIp() },
			});
			expect(afterRevoke.status).toBe(403);
		});

		it("logout clears the refresh token and invalidates the cookie", async () => {
			const { accessToken, refreshCookie } = await registerAndLogin(app);

			const res = await app.request("/api/auth/logout", {
				method: "POST",
				headers: authHeaders(accessToken ?? ""),
			});
			expect(res.status).toBe(200);

			const stored = await findUser(TEST_USER.email);
			expect(stored?.refreshToken).toBeNull();

			const refresh = await app.request("/api/auth/refresh", {
				method: "POST",
				headers: { cookie: refreshCookie, "x-forwarded-for": uniqueIp() },
			});
			expect(refresh.status).toBe(403);
		});
	});
});
