import { beforeEach, describe, expect, it } from "bun:test";
import { resetDb } from "@tests/helpers/test-db";
import { db } from "@/shared/configs/database";
import { usersTable } from "@/shared/configs/database/schema";
import { UserRepository } from "@/shared/repositories/user.repository";

beforeEach(resetDb);

describe("soft delete (UserRepository)", () => {
	const repo = new UserRepository();

	it("excludes soft-deleted users from every read", async () => {
		const [user] = await db
			.insert(usersTable)
			.values({ name: "Ada", email: "ada@example.com", password: "hash" })
			.returning();
		const id = user?.id ?? 0;

		expect(await repo.findById(id)).toBeDefined();
		expect(await repo.countActive()).toBe(1);

		await repo.softDeleteById(id);

		expect(await repo.findById(id)).toBeUndefined();
		expect(await repo.findSafeById(id)).toBeUndefined();
		expect(await repo.countActive()).toBe(0);
		expect(await repo.findAllSafe(20, 0)).toHaveLength(0);
	});
});
