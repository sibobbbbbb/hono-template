import { sign, verify } from "hono/jwt";
import { env } from "@/shared/configs/environment";
import { ForbiddenError } from "@/shared/exceptions/api-error";
import { parseJwtExpiresIn } from "@/shared/utils/parse-jwt-expires-in";

/**
 * Define the type for payload that will be included in the token.
 */
export type TokenPayload = {
	/** Subject — the user id as a string, per the JWT spec (RFC 7519). */
	sub: string;
	name: string;
};

/**
 * Generates an access token and a refresh token.
 *
 * Each token carries a unique `jti` (token id) so that two tokens minted for
 * the same user within the same second are still distinct — which is what
 * makes refresh-token rotation and reuse-detection reliable.
 *
 * @param payload Data to be included in the token (sub, name).
 * @returns Object containing accessToken and refreshToken.
 */
export const generateTokens = async (payload: TokenPayload) => {
	const accessToken = await sign(
		{
			...payload,
			jti: crypto.randomUUID(),
			exp:
				Math.floor(Date.now() / 1000) + parseJwtExpiresIn(env.JWT_EXPIRES_IN),
		},
		env.JWT_SECRET,
	);

	const refreshToken = await sign(
		{
			...payload,
			jti: crypto.randomUUID(),
			exp:
				Math.floor(Date.now() / 1000) +
				parseJwtExpiresIn(env.JWT_REFRESH_EXPIRES_IN),
		},
		env.JWT_REFRESH_SECRET,
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
	token: string,
): Promise<TokenPayload> => {
	try {
		return (await verify(
			token,
			env.JWT_REFRESH_SECRET,
		)) as unknown as TokenPayload;
	} catch (_error) {
		throw new ForbiddenError("Refresh token is invalid or expired");
	}
};

/**
 * Hashes a refresh token with a full-length SHA-256 digest (Web Crypto).
 *
 * Unlike bcrypt (which silently truncates input at 72 bytes and is designed
 * for slow hashing of *low-entropy* secrets like passwords), a JWT refresh
 * token is already high-entropy — so a fast cryptographic digest over its
 * entire length is both correct and runtime-portable (Bun/Node/edge).
 *
 * @param token Refresh token string to be hashed.
 * @returns A promise that resolves to the hex-encoded SHA-256 digest.
 */
export const hashRefreshToken = async (token: string): Promise<string> => {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(token),
	);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
};
