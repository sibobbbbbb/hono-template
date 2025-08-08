import { sign, verify } from "hono/jwt";
import * as bcrypt from "bcrypt";
import { env } from "@/shared/configs/environment";
import { parseJwtExpiresIn } from "@/shared/utils/parse-jwt-expires-in";
import { ForbiddenError } from "@/shared/exceptions/api-error";

/**
 * Define the type for payload that will be included in the token.
 */
export type TokenPayload = {
  sub: number;
  name: string;
};

/**
 * Generates access token and refresh token.
 * @param payload Data to be included in the token (sub, name).
 * @returns Object containing accessToken and refreshToken.
 */
export const generateTokens = async (payload: TokenPayload) => {
  // Create access token
  const accessToken = await sign(
    {
      ...payload,
      exp:
        Math.floor(Date.now() / 1000) + parseJwtExpiresIn(env.JWT_EXPIRES_IN),
    },
    env.JWT_SECRET
  );

  // Create refresh token
  const refreshToken = await sign(
    {
      ...payload,
      exp:
        Math.floor(Date.now() / 1000) +
        parseJwtExpiresIn(env.JWT_REFRESH_EXPIRES_IN),
    },
    env.JWT_REFRESH_SECRET
  );

  return { accessToken, refreshToken };
};

/**
 * Verifies a refresh token.
 * @param token Refresh token to be verified.
 * @returns A promise that resolves to the token payload if valid.
 * @throws {ForbiddenError} If token is invalid or expired.
 */
export const verifyRefreshToken = async (
  token: string
): Promise<TokenPayload> => {
  try {
    return (await verify(
      token,
      env.JWT_REFRESH_SECRET
    )) as unknown as TokenPayload;
  } catch (_error) {
    throw new ForbiddenError("Refresh token is invalid or expired");
  }
};

/**
 * Hashes a refresh token using bcrypt.
 * @param token Refresh token string to be hashed.
 * @returns A promise that resolves to the hashed token.
 */
export const hashRefreshToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, 10);
};
