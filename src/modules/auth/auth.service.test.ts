import { beforeEach, describe, expect, it } from "bun:test";
import { createFakeUserRepository } from "@tests/helpers/fake-user-repository";
import { createAuthService } from "@/modules/auth/auth.service";
import { hashRefreshToken } from "@/modules/auth/auth.token.helper";
import {
	ConflictError,
	ForbiddenError,
	UnauthorizedError,
} from "@/shared/exceptions/api-error";
import type { User } from "@/shared/models/user.model";

const credentials = {
	name: "Ada",
	email: "ada@example.com",
	password: "supersecret",
};

describe("createAuthService", () => {
	let users: User[];
	let service: ReturnType<typeof createAuthService>;

	beforeEach(() => {
		const fake = createFakeUserRepository();
		users = fake.users;
		service = createAuthService(fake.repository);
	});

	describe("register", () => {
		it("hashes the password and never stores plaintext", async () => {
			const user = await service.register(credentials);
			expect(user.password).not.toBe(credentials.password);
			expect(
				await Bun.password.verify(credentials.password, user.password),
			).toBe(true);
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

		it("returns a token pair and stores the refresh token HASHED", async () => {
			const { accessToken, refreshToken } = await service.login({
				email: credentials.email,
				password: credentials.password,
			});
			expect(typeof accessToken).toBe("string");
			expect(typeof refreshToken).toBe("string");
			expect(users[0]?.refreshToken).toBe(await hashRefreshToken(refreshToken));
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

		it("rotates the token pair on a valid refresh", async () => {
			const storedBefore = users[0]?.refreshToken;
			const result = await service.refreshToken(refreshToken);
			expect(result.refreshToken).not.toBe(refreshToken);
			expect(users[0]?.refreshToken).not.toBe(storedBefore);
		});

		it("denies and revokes on reuse of a rotated token", async () => {
			await service.refreshToken(refreshToken);
			await expect(service.refreshToken(refreshToken)).rejects.toBeInstanceOf(
				ForbiddenError,
			);
			expect(users[0]?.refreshToken).toBeNull();
		});
	});

	describe("logout", () => {
		it("clears the stored refresh token", async () => {
			const user = await service.register(credentials);
			await service.login({
				email: credentials.email,
				password: credentials.password,
			});
			await service.logout(user.id);
			expect(users[0]?.refreshToken).toBeNull();
		});
	});
});
