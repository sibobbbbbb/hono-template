import { Hono } from "hono";
import {
  LoginRequestSchema,
  RegisterRequestSchema,
} from "@/modules/auth/auth.schemas";
import { validate } from "@/shared/middlewares/validation.middleware";
import { authController } from "@/container";
import { authLimiter } from "@/shared/middlewares/rate-limiter.middleware";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";

/**
 * @file Defines the routes for authentication-related endpoints.
 *
 * This router handles all routes prefixed with `/api/auth`, including
 * user registration, login, token refreshing, and logout. It applies
 * necessary middlewares like rate limiting and validation for each route.
 */
const authRouter = new Hono();

authRouter.post(
  "/register",
  authLimiter,
  validate(RegisterRequestSchema),
  authController.register
);

authRouter.post(
  "/login",
  authLimiter,
  validate(LoginRequestSchema),
  authController.login
);

authRouter.post(
  "/refresh", 
  authController.refreshToken
);

authRouter.post(
  "/logout", 
  authMiddleware, 
  authController.logout
);

export default authRouter;
