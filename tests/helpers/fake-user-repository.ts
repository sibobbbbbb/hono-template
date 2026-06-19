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
	...overrides,
});

/**
 * An in-memory UserRepository for unit tests — no database, no mocking
 * framework. Because services are factories that take the repository as an
 * argument, you simply pass this in to test business logic in isolation.
 */
export const createFakeUserRepository = (seed: User[] = []) => {
	const users: User[] = [...seed];
	let nextId = users.length + 1;

	const repository: UserRepository = {
		async create(data: NewUser): Promise<User> {
			const user = makeUser({ ...data, id: nextId++, createdAt: new Date() });
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
			const { password: _password, ...safe } = user;
			return safe;
		},
		async findAllSafe(): Promise<SafeUser[]> {
			return users.map(({ password: _password, ...safe }) => safe);
		},
	};

	return { repository, users };
};
