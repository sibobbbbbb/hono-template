import { Hono } from "hono";
import { createUserService } from "@/modules/user/user.service";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { generalApiLimiter } from "@/shared/middlewares/rate-limiter.middleware";
import { UserRepository } from "@/shared/repositories/user.repository";
import { sendSuccess } from "@/shared/utils/api-response";

/**
 * @file User routes (`/api/users`).
 *
 * All routes require authentication and are rate-limited. Handlers are chained
 * inline so their types flow into the exported RPC `AppType`.
 */
const userService = createUserService(new UserRepository());

const userRouter = new Hono()
	.use("*", authMiddleware)
	.use("*", generalApiLimiter)
	.get("/profile", async (c) => {
		const { sub: userId } = c.get("jwtPayload");
		const profile = await userService.getMyProfile(userId);
		return sendSuccess(c, 200, "Profile fetched successfully", profile);
	});

export default userRouter;
