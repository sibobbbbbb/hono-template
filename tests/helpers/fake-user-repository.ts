import type { NewUser, SafeUser, User } from "@/shared/models/user.model";
import type { UserRepository } from "@/shared/repositories/user.repository";

/** Builds a fully-populated User row for use as test data. */
export const makeUser = (overrides: Partial<User> = {}): User => ({
	id: 1,
	name: "Ada Lovelace",
	email: "ada@example.com",
	password: "hashed-password",
	role: "user",
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null,
	...overrides,
});

/**
 * An in-memory UserRepository for unit tests — no database, no mocking
 * framework. Mirrors the real repository, including soft-delete exclusion.
 */
export const createFakeUserRepository = (seed: User[] = []) => {
	const users: User[] = [...seed];
	let nextId = users.length + 1;
	const active = () => users.filter((u) => !u.deletedAt);

	const repository: UserRepository = {
		async create(data: NewUser): Promise<User> {
			const user = makeUser({
				...data,
				id: nextId++,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			users.push(user);
			return user;
		},
		async findByEmail(email: string) {
			return active().find((u) => u.email === email);
		},
		async findById(id: number) {
			return active().find((u) => u.id === id);
		},
		async findSafeById(id: number): Promise<SafeUser | undefined> {
			const user = active().find((u) => u.id === id);
			if (!user) return undefined;
			const { password: _password, ...safe } = user;
			return safe;
		},
		async findAllSafe(limit: number, offset: number): Promise<SafeUser[]> {
			return active()
				.slice(offset, offset + limit)
				.map(({ password: _password, ...safe }) => safe);
		},
		async countActive(): Promise<number> {
			return active().length;
		},
		async softDeleteById(id: number) {
			const user = users.find((u) => u.id === id);
			if (user) user.deletedAt = new Date();
		},
	};

	return { repository, users };
};
