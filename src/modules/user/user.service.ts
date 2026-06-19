import { NotFoundError } from "@/shared/exceptions/api-error";
import type { SafeUser } from "@/shared/models/user.model";
import type { UserRepository } from "@/shared/repositories/user.repository";

/**
 * Creates the user service.
 *
 * A factory (not a class) so its dependency is injected explicitly and the
 * service can be unit-tested with a fake repository.
 */
export const createUserService = (userRepository: UserRepository) => ({
	/**
	 * Returns the authenticated user's profile. Sensitive fields are already
	 * stripped at the data layer by `findSafeById`.
	 *
	 * @throws NotFoundError if the user does not exist.
	 */
	async getMyProfile(id: number): Promise<SafeUser> {
		const user = await userRepository.findSafeById(id);
		if (!user) {
			throw new NotFoundError("User not found");
		}
		return user;
	},

	/** Lists all users (without password hashes) — for admin use. */
	listUsers(): Promise<SafeUser[]> {
		return userRepository.findAllSafe();
	},
});

export type UserService = ReturnType<typeof createUserService>;
