import type { usersTable } from "@/shared/configs/database/schema";

/**
 * User model type definitions, inferred from the Drizzle schema so they stay
 * in sync with the database automatically.
 */
export type User = typeof usersTable.$inferSelect;

export type NewUser = typeof usersTable.$inferInsert;

/** The set of authorization roles (`"user" | "admin"`). */
export type UserRole = User["role"];

/** A user without sensitive fields — safe to return to clients. */
export type SafeUser = Omit<User, "password">;

/** Returns a client-safe view of a user (password removed). */
export const toSafeUser = (user: User): SafeUser => {
	const { password: _password, ...safe } = user;
	return safe;
};
