import { beforeEach, describe, expect, it } from "bun:test";
import { createAuthService } from "@/modules/auth/auth.service";
import { hashRefreshToken } from "@/modules/auth/auth.token.helper";
import {
	ConflictError,
	ForbiddenError,
	UnauthorizedError,
} from "@/shared/exceptions/api-error";
import type { NewUser, SafeUser, User } from "@/shared/models/user.model";
import type { UserRepository } from "@/shared/repositories/user.repository";

/**
 * An in-memory fake repository. Because the service is a factory that takes
 * its dependency as an argument, no mocking framework or DI container is
 * needed — we just pass a plain object that satisfies the repository shape.
 */
const createFakeRepo = () => {
	const users: User[] = [];
	let nextId = 1;

	const repo: UserRepository = {
		async create(data: NewUser): Promise<User> {
			const user: User = {
				id: nextId++,
				name: data.name,
				email: data.email,
				password: data.password,
				refreshToken: data.refreshToken ?? null,
				createdAt: new Date(),
			};
			users.push(user);
			return user;
		},
		async findByEmail(email: string) {
			return users.find((u) => u.email === email);
		},
		async findById(id: number) {
			return users.find((u) => u.id === id);
		},
		async findSafeById(id: number): Promise<SafeUser | undefined> {
			const user = users.find((u) => u.id === id);
			if (!user) return undefined;
			const {
				password: _password,
				refreshToken: _refreshToken,
				...safe
			} = user;
			return safe;
		},
		async updateRefreshToken(id: number, token: string | null) {
			const user = users.find((u) => u.id === id);
			if (user) user.refreshToken = token;
		},
	};

	return { repo, users };
};

const credentials = {
	name: "Ada",
	email: "ada@example.com",
	password: "supersecret",
};

describe("createAuthService", () => {
	let users: User[];
	let service: ReturnType<typeof createAuthService>;

	beforeEach(() => {
		const fake = createFakeRepo();
		users = fake.users;
		service = createAuthService(fake.repo);
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
			await service.refreshToken(refreshToken); // rotate once
			await expect(service.refreshToken(refreshToken)).rejects.toBeInstanceOf(
				ForbiddenError,
			);
			expect(users[0]?.refreshToken).toBeNull(); // revoked
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
