import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// This file defines the database schema for the 'users' table using Drizzle ORM.
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  refreshToken: text('refresh_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});