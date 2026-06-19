import { eq } from "drizzle-orm";
import { db } from "@/shared/configs/database";
import { usersTable } from "@/shared/configs/database/schema";
import { InternalServerError } from "@/shared/exceptions/api-error";
import type { NewUser, SafeUser, User } from "@/shared/models/user.model";

/** Columns to omit so the password hash never leaves the data layer. */
const safeColumns = { password: false } as const;

/**
 * @class UserRepository
 *
 * Implements the Repository Pattern for the User entity. Sensitive columns are
 * projected away here (see `findSafeById` / `findAllSafe`) so the password hash
 * never leaks out by default.
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

	/** Finds a single user by email (includes the password hash — for auth only). */
	public findByEmail(email: string): Promise<User | undefined> {
		return db.query.usersTable.findFirst({
			where: eq(usersTable.email, email),
		});
	}

	/** Finds a single user by id (includes the password hash — for auth only). */
	public findById(id: number): Promise<User | undefined> {
		return db.query.usersTable.findFirst({ where: eq(usersTable.id, id) });
	}

	/** Finds a user by id with the password hash stripped at the data layer. */
	public findSafeById(id: number): Promise<SafeUser | undefined> {
		return db.query.usersTable.findFirst({
			where: eq(usersTable.id, id),
			columns: safeColumns,
		});
	}

	/** Lists all users without their password hashes (e.g. for admin tooling). */
	public findAllSafe(): Promise<SafeUser[]> {
		return db.query.usersTable.findMany({ columns: safeColumns });
	}
}
