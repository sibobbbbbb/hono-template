import type {
	LoginRequest,
	RegisterRequest,
} from "@/modules/auth/auth.schemas";
import {
	ConflictError,
	ForbiddenError,
	UnauthorizedError,
} from "@/shared/exceptions/api-error";
import type { User } from "@/shared/models/user.model";
import type { UserRepository } from "@/shared/repositories/user.repository";
import {
	generateTokens,
	hashRefreshToken,
	verifyRefreshToken,
} from "./auth.token.helper";

/**
 * Creates the authentication service.
 *
 * A factory (not a class) so its dependency is injected explicitly and the
 * service can be unit-tested with a fake repository — no DI container needed.
 *
 * @param userRepository The user repository to back the service.
 */
export const createAuthService = (userRepository: UserRepository) => ({
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

	/** Verifies credentials and issues a fresh access/refresh token pair. */
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

		const tokens = await generateTokens({ sub: user.id, name: user.name });
		await userRepository.updateRefreshToken(
			user.id,
			await hashRefreshToken(tokens.refreshToken),
		);

		return tokens;
	},

	/**
	 * Validates a refresh token, rotates it, and returns a new token pair.
	 *
	 * If the provided token's hash does not match the stored one (possible
	 * reuse of a rotated/leaked token), the stored token is revoked to force
	 * re-authentication.
	 */
	async refreshToken(providedRefreshToken: string) {
		const payload = await verifyRefreshToken(providedRefreshToken);
		const user = await userRepository.findById(payload.sub);
		if (!user?.refreshToken) {
			throw new ForbiddenError("Access Denied");
		}

		const providedHash = await hashRefreshToken(providedRefreshToken);
		if (providedHash !== user.refreshToken) {
			await userRepository.updateRefreshToken(user.id, null);
			throw new ForbiddenError("Access Denied");
		}

		const tokens = await generateTokens({ sub: user.id, name: user.name });
		await userRepository.updateRefreshToken(
			user.id,
			await hashRefreshToken(tokens.refreshToken),
		);

		return tokens;
	},

	/** Clears the stored refresh token, invalidating the session. */
	async logout(userId: number): Promise<void> {
		await userRepository.updateRefreshToken(userId, null);
	},
});

export type AuthService = ReturnType<typeof createAuthService>;
