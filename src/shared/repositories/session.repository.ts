import { eq } from "drizzle-orm";
import { db } from "@/shared/configs/database";
import { sessionsTable } from "@/shared/configs/database/schema";
import { InternalServerError } from "@/shared/exceptions/api-error";
import type { NewSession, Session } from "@/shared/models/session.model";

/**
 * @class SessionRepository
 *
 * Data access for refresh-token sessions. Tokens are looked up by their
 * SHA-256 hash (a unique index), never by the raw value.
 */
export class SessionRepository {
	/** Persists a new session and returns it. */
	public async create(data: NewSession): Promise<Session> {
		const [session] = await db.insert(sessionsTable).values(data).returning();
		if (!session) {
			throw new InternalServerError("Failed to create session");
		}
		return session;
	}

	/** Finds a session by its token hash. */
	public findByTokenHash(tokenHash: string): Promise<Session | undefined> {
		return db.query.sessionsTable.findFirst({
			where: eq(sessionsTable.tokenHash, tokenHash),
		});
	}

	/** Revokes a single session (one device). */
	public async deleteByTokenHash(tokenHash: string): Promise<void> {
		await db
			.delete(sessionsTable)
			.where(eq(sessionsTable.tokenHash, tokenHash));
	}

	/** Revokes every session for a user (logout everywhere). */
	public async deleteAllForUser(userId: number): Promise<void> {
		await db.delete(sessionsTable).where(eq(sessionsTable.userId, userId));
	}
}
