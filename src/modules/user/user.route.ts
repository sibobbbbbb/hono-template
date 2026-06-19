import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { createUserService } from "@/modules/user/user.service";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { generalApiLimiter } from "@/shared/middlewares/rate-limiter.middleware";
import { requireRole } from "@/shared/middlewares/require-role";
import { UserRepository } from "@/shared/repositories/user.repository";
import { sendSuccess } from "@/shared/utils/api-response";
import { getPagination, paginationMeta } from "@/shared/utils/pagination";

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
	.get(
		"/profile",
		describeRoute({
			description: "Get the authenticated user's profile.",
			tags: ["Users"],
			security: [{ bearerAuth: [] }],
			responses: {
				200: { description: "The current user's profile" },
				401: { description: "Unauthorized" },
			},
		}),
		async (c) => {
			const userId = Number(c.get("jwtPayload").sub);
			const profile = await userService.getMyProfile(userId);
			return sendSuccess(c, 200, "Profile fetched successfully", profile);
		},
	)
	.get(
		"/",
		describeRoute({
			description: "List all users (admin only). Supports ?page and ?limit.",
			tags: ["Users"],
			security: [{ bearerAuth: [] }],
			responses: {
				200: { description: "A page of users with pagination metadata" },
				401: { description: "Unauthorized" },
				403: { description: "Forbidden — admin role required" },
			},
		}),
		requireRole("admin"),
		async (c) => {
			const { page, limit } = getPagination(c);
			const { data, total } = await userService.listUsers(page, limit);
			return sendSuccess(
				c,
				200,
				"Users fetched successfully",
				data,
				paginationMeta(page, limit, total),
			);
		},
	);

export default userRouter;
