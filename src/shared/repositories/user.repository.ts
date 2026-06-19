import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/shared/configs/database";
import { usersTable } from "@/shared/configs/database/schema";
import { InternalServerError } from "@/shared/exceptions/api-error";
import type { NewUser, SafeUser, User } from "@/shared/models/user.model";

/** Columns to omit so the password hash never leaves the data layer. */
const safeColumns = { password: false } as const;

/** Excludes soft-deleted rows. */
const notDeleted = isNull(usersTable.deletedAt);

/**
 * @class UserRepository
 *
 * Repository for the User entity. Sensitive columns are projected away here
 * (see `findSafeById` / `findAllSafe`) and soft-deleted rows are excluded from
 * every read.
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

	/** Finds a single active user by email (includes the password hash — auth only). */
	public findByEmail(email: string): Promise<User | undefined> {
		return db.query.usersTable.findFirst({
			where: and(eq(usersTable.email, email), notDeleted),
		});
	}

	/** Finds a single active user by id (includes the password hash — auth only). */
	public findById(id: number): Promise<User | undefined> {
		return db.query.usersTable.findFirst({
			where: and(eq(usersTable.id, id), notDeleted),
		});
	}

	/** Finds an active user by id with the password hash stripped. */
	public findSafeById(id: number): Promise<SafeUser | undefined> {
		return db.query.usersTable.findFirst({
			where: and(eq(usersTable.id, id), notDeleted),
			columns: safeColumns,
		});
	}

	/** Lists active users (without password hashes), paged by limit/offset. */
	public findAllSafe(limit: number, offset: number): Promise<SafeUser[]> {
		return db.query.usersTable.findMany({
			where: notDeleted,
			columns: safeColumns,
			orderBy: usersTable.id,
			limit,
			offset,
		});
	}

	/** Counts active users (for pagination metadata). */
	public async countActive(): Promise<number> {
		const [row] = await db
			.select({ value: count() })
			.from(usersTable)
			.where(notDeleted);
		return row?.value ?? 0;
	}

	/** Soft-deletes a user (sets `deletedAt`); reads will no longer return it. */
	public async softDeleteById(id: number): Promise<void> {
		await db
			.update(usersTable)
			.set({ deletedAt: new Date() })
			.where(eq(usersTable.id, id));
	}
}
