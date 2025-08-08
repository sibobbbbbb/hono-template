import { Hono } from "hono";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { userController } from "@/container/index";
import { generalApiLimiter } from "@/shared/middlewares/rate-limiter.middleware";

/**
 * @file User routes.
 *
 * This file defines the routes related to user operations, such as fetching
 * the user's profile. It applies necessary middlewares like authentication
 * and rate limiting to ensure secure and controlled access to these endpoints.
 */

const userRouter = new Hono();

// Apply authentication middleware to all user routes
userRouter.use("*", authMiddleware);

// Rate limiter middleware for user routes
userRouter.use("*", generalApiLimiter);

// Define user-related routes
userRouter.get("/profile", userController.getMyProfile);

export default userRouter;
