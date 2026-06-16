import { describe, expect, it } from "bun:test";
import {
	createFakeUserRepository,
	makeUser,
} from "@tests/helpers/fake-user-repository";
import { createUserService } from "@/modules/user/user.service";
import { NotFoundError } from "@/shared/exceptions/api-error";

describe("createUserService", () => {
	it("returns a safe profile (no password or refreshToken) for an existing user", async () => {
		const { repository } = createFakeUserRepository([
			makeUser({ id: 1, email: "ada@example.com", password: "hashed" }),
		]);
		const service = createUserService(repository);

		const profile = await service.getMyProfile(1);

		expect(profile.email).toBe("ada@example.com");
		const asRecord = profile as Record<string, unknown>;
		expect(asRecord.password).toBeUndefined();
		expect(asRecord.refreshToken).toBeUndefined();
	});

	it("throws NotFoundError when the user does not exist", async () => {
		const { repository } = createFakeUserRepository();
		const service = createUserService(repository);

		await expect(service.getMyProfile(999)).rejects.toBeInstanceOf(
			NotFoundError,
		);
	});
});
