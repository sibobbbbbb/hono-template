import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { describeRoute } from "hono-openapi";
import {
	LoginRequestSchema,
	RegisterRequestSchema,
} from "@/modules/auth/auth.schemas";
import { createAuthService } from "@/modules/auth/auth.service";
import { env } from "@/shared/configs/environment";
import { UnauthorizedError } from "@/shared/exceptions/api-error";
import { authMiddleware } from "@/shared/middlewares/auth.middleware";
import { authLimiter } from "@/shared/middlewares/rate-limiter.middleware";
import { jsonValidator } from "@/shared/middlewares/validator";
import { toSafeUser } from "@/shared/models/user.model";
import { SessionRepository } from "@/shared/repositories/session.repository";
import { UserRepository } from "@/shared/repositories/user.repository";
import { sendSuccess } from "@/shared/utils/api-response";
import {
	clearRefreshTokenCookie,
	setRefreshTokenCookie,
} from "@/shared/utils/cookie-helper";

/**
 * @file Authentication routes (`/api/auth`).
 *
 * Handlers are defined inline and chained so per-route types accumulate,
 * enabling the typed Hono RPC client. `jsonValidator` performs validation
 * (yielding a typed `c.req.valid("json")`) while `describeRoute` documents
 * each endpoint for the OpenAPI spec.
 */
const authService = createAuthService(
	new UserRepository(),
	new SessionRepository(),
);

const authRouter = new Hono()
	.post(
		"/register",
		describeRoute({
			description: "Register a new user.",
			tags: ["Auth"],
			responses: {
				201: { description: "User registered successfully" },
				400: { description: "Validation failed" },
				409: { description: "Email already in use" },
			},
		}),
		authLimiter,
		jsonValidator(RegisterRequestSchema),
		async (c) => {
			const data = c.req.valid("json");
			const user = await authService.register(data);
			return sendSuccess(
				c,
				201,
				"User registered successfully",
				toSafeUser(user),
			);
		},
	)
	.post(
		"/login",
		describeRoute({
			description: "Log in and receive an access token; sets a refresh cookie.",
			tags: ["Auth"],
			responses: {
				200: { description: "Login successful" },
				401: { description: "Invalid credentials" },
			},
		}),
		authLimiter,
		jsonValidator(LoginRequestSchema),
		async (c) => {
			const data = c.req.valid("json");
			const { accessToken, refreshToken } = await authService.login(data);
			setRefreshTokenCookie(c, refreshToken);
			return sendSuccess(c, 200, "Login successful", { accessToken });
		},
	)
	.post(
		"/refresh",
		describeRoute({
			description: "Rotate the session using the refresh cookie.",
			tags: ["Auth"],
			responses: {
				200: { description: "Token refreshed" },
				401: { description: "Missing refresh token" },
				403: { description: "Invalid, expired, or reused refresh token" },
			},
		}),
		async (c) => {
			const token = getCookie(c, env.JWT_REFRESH_COOKIE_NAME);
			if (!token) {
				throw new UnauthorizedError("Refresh token not found");
			}
			const { accessToken, refreshToken } =
				await authService.refreshToken(token);
			setRefreshTokenCookie(c, refreshToken); // rotation: replace the cookie
			return sendSuccess(c, 200, "Token refreshed successfully", {
				accessToken,
			});
		},
	)
	.post(
		"/logout",
		describeRoute({
			description: "Revoke the current session.",
			tags: ["Auth"],
			security: [{ bearerAuth: [] }],
			responses: {
				200: { description: "Logout successful" },
				401: { description: "Unauthorized" },
			},
		}),
		authMiddleware,
		async (c) => {
			const token = getCookie(c, env.JWT_REFRESH_COOKIE_NAME);
			if (token) {
				await authService.logout(token);
			}
			clearRefreshTokenCookie(c);
			return sendSuccess(c, 200, "Logout successful");
		},
	);

export default authRouter;
