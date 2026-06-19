import { beforeEach, describe, expect, it } from "bun:test";
import { createFakeSessionRepository } from "@tests/helpers/fake-session-repository";
import { createFakeUserRepository } from "@tests/helpers/fake-user-repository";
import { decode } from "hono/jwt";
import { createAuthService } from "@/modules/auth/auth.service";
import { hashRefreshToken } from "@/modules/auth/auth.token.helper";
import {
	ConflictError,
	ForbiddenError,
	UnauthorizedError,
} from "@/shared/exceptions/api-error";
import type { Session } from "@/shared/models/session.model";

const credentials = {
	name: "Ada",
	email: "ada@example.com",
	password: "supersecret",
};

describe("createAuthService", () => {
	let sessions: Session[];
	let service: ReturnType<typeof createAuthService>;

	beforeEach(() => {
		const users = createFakeUserRepository();
		const sess = createFakeSessionRepository();
		sessions = sess.sessions;
		service = createAuthService(users.repository, sess.repository);
	});

	describe("register", () => {
		it("hashes the password and defaults the role to 'user'", async () => {
			const user = await service.register(credentials);
			expect(user.password).not.toBe(credentials.password);
			expect(
				await Bun.password.verify(credentials.password, user.password),
			).toBe(true);
			expect(user.role).toBe("user");
		});

		it("rejects a duplicate email", async () => {
			await service.register(credentials);
			await expect(service.register(credentials)).rejects.toBeInstanceOf(
				ConflictError,
			);
		});
	});

	describe("login", () => {
		beforeEach(async () => {
			await service.register(credentials);
		});

		it("embeds the role in the access token and stores a hashed session", async () => {
			const { accessToken, refreshToken } = await service.login({
				email: credentials.email,
				password: credentials.password,
			});
			expect(typeof accessToken).toBe("string");
			expect(typeof refreshToken).toBe("string");

			const { payload } = decode(accessToken);
			expect(payload.role).toBe("user");

			expect(sessions).toHaveLength(1);
			expect(sessions[0]?.tokenHash).toBe(await hashRefreshToken(refreshToken));
		});

		it("rejects a wrong password", async () => {
			await expect(
				service.login({ email: credentials.email, password: "wrong" }),
			).rejects.toBeInstanceOf(UnauthorizedError);
		});

		it("rejects an unknown email", async () => {
			await expect(
				service.login({ email: "nobody@example.com", password: "whatever" }),
			).rejects.toBeInstanceOf(UnauthorizedError);
		});
	});

	describe("refreshToken", () => {
		let refreshToken: string;

		beforeEach(async () => {
			await service.register(credentials);
			({ refreshToken } = await service.login({
				email: credentials.email,
				password: credentials.password,
			}));
		});

		it("rotates the session: old token invalid, exactly one live session", async () => {
			const result = await service.refreshToken(refreshToken);
			expect(result.refreshToken).not.toBe(refreshToken);
			expect(sessions).toHaveLength(1);
			expect(sessions[0]?.tokenHash).toBe(
				await hashRefreshToken(result.refreshToken),
			);
		});

		it("denies reuse of a rotated token", async () => {
			await service.refreshToken(refreshToken);
			await expect(service.refreshToken(refreshToken)).rejects.toBeInstanceOf(
				ForbiddenError,
			);
		});
	});

	describe("logout", () => {
		it("revokes the session for the given refresh token", async () => {
			await service.register(credentials);
			const { refreshToken } = await service.login({
				email: credentials.email,
				password: credentials.password,
			});
			expect(sessions).toHaveLength(1);

			await service.logout(refreshToken);
			expect(sessions).toHaveLength(0);
		});
	});
});
