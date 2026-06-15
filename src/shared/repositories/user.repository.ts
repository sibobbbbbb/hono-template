import { eq } from "drizzle-orm";
import { db } from "@/shared/configs/database";
import { usersTable } from "@/shared/configs/database/schema";
import { InternalServerError } from "@/shared/exceptions/api-error";
import type { NewUser, SafeUser, User } from "@/shared/models/user.model";

/**
 * @class UserRepository
 *
 * Implements the Repository Pattern for the User entity, abstracting all
 * database interactions behind a clean API. Sensitive columns are projected
 * away at this layer (see `findSafeById`) so the password hash and refresh
 * token never leak out by default.
 */
export class UserRepository {
	/** Creates a new user and returns the inserted row. */
	public async create(data: NewUser): Promise<User> {
		const [newUser] = await db.insert(usersTable).values(data).returning();
		if (!newUser) {
			throw new InternalServerError("Failed to create user");
		}
		return newUser;
	}

	/** Finds a single user by email (includes sensitive columns — for auth only). */
	public findByEmail(email: string): Promise<User | undefined> {
		return db.query.usersTable.findFirst({
			where: eq(usersTable.email, email),
		});
	}

	/** Finds a single user by id (includes sensitive columns — for auth only). */
	public findById(id: number): Promise<User | undefined> {
		return db.query.usersTable.findFirst({
			where: eq(usersTable.id, id),
		});
	}

	/** Finds a user by id with sensitive columns stripped at the data layer. */
	public findSafeById(id: number): Promise<SafeUser | undefined> {
		return db.query.usersTable.findFirst({
			where: eq(usersTable.id, id),
			columns: { password: false, refreshToken: false },
		});
	}

	/** Sets (or clears, with `null`) the stored refresh-token hash for a user. */
	public async updateRefreshToken(
		userId: number,
		refreshToken: string | null,
	): Promise<void> {
		await db
			.update(usersTable)
			.set({ refreshToken })
			.where(eq(usersTable.id, userId));
	}
}
