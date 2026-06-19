import type { NewSession, Session } from "@/shared/models/session.model";
import type { SessionRepository } from "@/shared/repositories/session.repository";

/**
 * An in-memory SessionRepository for unit tests, mirroring the real one's
 * behaviour (lookup/delete by token hash) without a database.
 */
export const createFakeSessionRepository = (seed: Session[] = []) => {
	const sessions: Session[] = [...seed];

	const repository: SessionRepository = {
		async create(data: NewSession): Promise<Session> {
			const session: Session = {
				id: data.id,
				userId: data.userId,
				tokenHash: data.tokenHash,
				expiresAt: data.expiresAt,
				createdAt: data.createdAt ?? new Date(),
			};
			sessions.push(session);
			return session;
		},
		async findByTokenHash(tokenHash: string) {
			return sessions.find((s) => s.tokenHash === tokenHash);
		},
		async deleteByTokenHash(tokenHash: string) {
			const index = sessions.findIndex((s) => s.tokenHash === tokenHash);
			if (index >= 0) sessions.splice(index, 1);
		},
		async deleteAllForUser(userId: number) {
			for (let i = sessions.length - 1; i >= 0; i--) {
				if (sessions[i]?.userId === userId) sessions.splice(i, 1);
			}
		},
	};

	return { repository, sessions };
};
