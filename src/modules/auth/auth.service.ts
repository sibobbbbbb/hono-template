import type {
	LoginRequest,
	RegisterRequest,
} from "@/modules/auth/auth.schemas";
import { env } from "@/shared/configs/environment";
import {
	ConflictError,
	ForbiddenError,
	UnauthorizedError,
} from "@/shared/exceptions/api-error";
import type { User } from "@/shared/models/user.model";
import type { SessionRepository } from "@/shared/repositories/session.repository";
import type { UserRepository } from "@/shared/repositories/user.repository";
import { parseJwtExpiresIn } from "@/shared/utils/parse-jwt-expires-in";
import {
	generateAccessToken,
	generateRefreshToken,
	hashRefreshToken,
} from "./auth.token.helper";

const refreshExpiry = () =>
	new Date(Date.now() + parseJwtExpiresIn(env.JWT_REFRESH_EXPIRES_IN) * 1000);

/**
 * Creates the authentication service.
 *
 * A factory (not a class) so its dependencies are injected explicitly and the
 * service can be unit-tested with fake repositories — no DI container needed.
 */
export const createAuthService = (
	userRepository: UserRepository,
	sessionRepository: SessionRepository,
) => {
	/** Issues an access token and persists a new refresh session. */
	const issueTokens = async (user: User) => {
		const accessToken = await generateAccessToken({
			sub: String(user.id),
			name: user.name,
			role: user.role,
		});
		const refreshToken = generateRefreshToken();
		await sessionRepository.create({
			id: crypto.randomUUID(),
			userId: user.id,
			tokenHash: await hashRefreshToken(refreshToken),
			expiresAt: refreshExpiry(),
		});
		return { accessToken, refreshToken };
	};

	return {
		/** Registers a new user with an argon2id-hashed password. */
		async register(requestData: RegisterRequest): Promise<User> {
			const existingUser = await userRepository.findByEmail(requestData.email);
			if (existingUser) {
				throw new ConflictError("User with this email already exists");
			}

			const password = await Bun.password.hash(requestData.password, {
				algorithm: "argon2id",
			});

			return userRepository.create({
				name: requestData.name,
				email: requestData.email,
				password,
			});
		},

		/** Verifies credentials, then issues an access token + refresh session. */
		async login(requestData: LoginRequest) {
			const user = await userRepository.findByEmail(requestData.email);
			if (!user) {
				throw new UnauthorizedError("Invalid email or password");
			}

			const isValid = await Bun.password.verify(
				requestData.password,
				user.password,
			);
			if (!isValid) {
				throw new UnauthorizedError("Invalid email or password");
			}

			return issueTokens(user);
		},

		/**
		 * Rotates a refresh session: the presented token's session is deleted and a
		 * new one is issued. A token that matches no live session (e.g. an already
		 * rotated/expired one) is denied — providing reuse detection for free.
		 */
		async refreshToken(providedRefreshToken: string) {
			const tokenHash = await hashRefreshToken(providedRefreshToken);
			const session = await sessionRepository.findByTokenHash(tokenHash);
			if (!session || session.expiresAt.getTime() < Date.now()) {
				throw new ForbiddenError("Access Denied");
			}

			await sessionRepository.deleteByTokenHash(tokenHash);

			const user = await userRepository.findById(session.userId);
			if (!user) {
				throw new ForbiddenError("Access Denied");
			}

			return issueTokens(user);
		},

		/** Revokes the session backing the given refresh token (this device). */
		async logout(providedRefreshToken: string): Promise<void> {
			await sessionRepository.deleteByTokenHash(
				await hashRefreshToken(providedRefreshToken),
			);
		},
	};
};

export type AuthService = ReturnType<typeof createAuthService>;
