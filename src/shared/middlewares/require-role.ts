import type { Context, Next } from "hono";
import { ForbiddenError } from "@/shared/exceptions/api-error";
import type { UserRole } from "@/shared/models/user.model";

/**
 * Authorization middleware factory — allows only the given role(s).
 *
 * Must run after `authMiddleware`, which populates `jwtPayload`. The role is
 * read from the access token, so no database lookup is needed.
 *
 * @example userRouter.get("/", requireRole("admin"), handler)
 */
export const requireRole = (...roles: UserRole[]) => {
	return async (c: Context, next: Next) => {
		const { role } = c.get("jwtPayload");
		if (!roles.includes(role)) {
			throw new ForbiddenError("Insufficient permissions");
		}
		await next();
	};
};
