import { Hono } from "hono";
import { getCookie } from "hono/cookie";
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
 * enabling the typed Hono RPC client. Validation is done by `jsonValidator`,
 * which yields `c.req.valid("json")` fully typed.
 */
const authService = createAuthService(new UserRepository());

const authRouter = new Hono()
	.post(
		"/register",
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
	.post("/login", authLimiter, jsonValidator(LoginRequestSchema), async (c) => {
		const data = c.req.valid("json");
		const { accessToken, refreshToken } = await authService.login(data);
		setRefreshTokenCookie(c, refreshToken);
		return sendSuccess(c, 200, "Login successful", { accessToken });
	})
	.post("/refresh", async (c) => {
		const token = getCookie(c, env.JWT_REFRESH_COOKIE_NAME);
		if (!token) {
			throw new UnauthorizedError("Refresh token not found");
		}
		const { accessToken, refreshToken } = await authService.refreshToken(token);
		setRefreshTokenCookie(c, refreshToken); // rotation: replace the cookie
		return sendSuccess(c, 200, "Token refreshed successfully", { accessToken });
	})
	.post("/logout", authMiddleware, async (c) => {
		const { sub } = c.get("jwtPayload");
		await authService.logout(Number(sub));
		clearRefreshTokenCookie(c);
		return sendSuccess(c, 200, "Logout successful");
	});

export default authRouter;
