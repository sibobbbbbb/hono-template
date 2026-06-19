import type { sessionsTable } from "@/shared/configs/database/schema";

/** A persisted refresh-token session (see `sessionsTable`). */
export type Session = typeof sessionsTable.$inferSelect;

export type NewSession = typeof sessionsTable.$inferInsert;
