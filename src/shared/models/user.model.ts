import { usersTable } from "@/shared/configs/database/schema";

/**
 * User model type definitions.
 *
 * This file defines the types for User and NewUser based on the database schema.
 * It uses Drizzle's type inference to ensure type safety when interacting with
 * user data in the database.
 *
 * @see https://orm.drizzle.team/kit-docs/schema-reference
 */
export type User = typeof usersTable.$inferSelect;

export type NewUser = typeof usersTable.$inferInsert;

export type SafeUser = Omit<User, "password" | "refreshToken">;