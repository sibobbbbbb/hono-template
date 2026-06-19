import {
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

/** Roles for coarse-grained authorization. */
export const userRole = pgEnum("user_role", ["user", "admin"]);

export const usersTable = pgTable("users", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	password: text("password").notNull(),
	role: userRole("role").notNull().default("user"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
	// Soft delete: a non-null value means the row is logically deleted.
	deletedAt: timestamp("deleted_at"),
});

/**
 * Refresh-token sessions.
 *
 * Each login creates a row; the cookie holds an opaque random token whose
 * SHA-256 hash is stored here. This enables per-session revocation (logout and
 * logout-all) and rotation with reuse detection — unlike a stateless JWT
 * refresh token, which cannot be revoked individually.
 */
export const sessionsTable = pgTable("sessions", {
	id: text("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	tokenHash: text("token_hash").notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
