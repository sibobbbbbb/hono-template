import { Context } from "hono";
import { getCookie } from "hono/cookie";
import { AuthService } from "@/modules/auth/auth.service";
import { LoginRequest, RegisterRequest } from "@/modules/auth/auth.schemas";
import { sendSuccess } from "@/shared/utils/api-response";
import { UnauthorizedError } from "@/shared/exceptions/api-error";
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "@/shared/utils/cookie-helper";

/**
 * @class AuthController
 * Handles the HTTP layer for authentication. It receives requests,
 * calls the appropriate service methods with request data, and
 * formats the HTTP response (success or error).
 */
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Register a new user.
   */
  public register = async (c: Context) => {
    const validatedData = c.get("validatedData") as RegisterRequest;
    const newUser = await this.authService.register(validatedData);
    const { password: _password, refreshToken: _refreshToken, ...safeUser } = newUser;
    return sendSuccess(c, 201, "User registered successfully", safeUser);
  };

  /**
   * Login and set tokens.
   */
  public login = async (c: Context) => {
    const validatedData = c.get("validatedData") as LoginRequest;
    const { accessToken, refreshToken } = await this.authService.login(
      validatedData
    );

    setRefreshTokenCookie(c, refreshToken);

    return sendSuccess(c, 200, "Login successful", { accessToken });
  };

  /**
   * Refresh access token.
   */
  public refreshToken = async (c: Context) => {
    const refreshToken = getCookie(c, "refreshToken");
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token not found");
    }

    const { accessToken } = await this.authService.refreshToken(refreshToken);
    return sendSuccess(c, 200, "Token refreshed successfully", {
      accessToken,
    });
  };

  /**
   * Logout and remove refresh token.
   */
  public logout = async (c: Context) => {
    const { sub: userId } = c.get("jwtPayload");
    await this.authService.logout(userId);

    clearRefreshTokenCookie(c);

    return sendSuccess(c, 200, "Logout successful");
  };
}
