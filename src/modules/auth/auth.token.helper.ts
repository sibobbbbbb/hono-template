import { sign } from "hono/jwt";
import { env } from "@/shared/configs/environment";
import type { UserRole } from "@/shared/models/user.model";
import { parseJwtExpiresIn } from "@/shared/utils/parse-jwt-expires-in";

/** Claims carried by the short-lived access token. */
export type AccessTokenPayload = {
	/** Subject — the user id as a string, per the JWT spec (RFC 7519). */
	sub: string;
	name: string;
	role: UserRole;
};

/**
 * Signs a short-lived access JWT carrying the user's identity and role.
 *
 * A unique `jti` is included so two tokens minted in the same second still
 * differ.
 */
export const generateAccessToken = (
	payload: AccessTokenPayload,
): Promise<string> =>
	sign(
		{
			...payload,
			jti: crypto.randomUUID(),
			exp:
				Math.floor(Date.now() / 1000) + parseJwtExpiresIn(env.JWT_EXPIRES_IN),
		},
		env.JWT_SECRET,
	);

/**
 * Generates a high-entropy, opaque refresh token (256 bits, hex-encoded).
 *
 * It is never a JWT: only its hash is stored server-side, so refresh tokens are
 * revocable per session.
 */
export const generateRefreshToken = (): string =>
	Array.from(crypto.getRandomValues(new Uint8Array(32)))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

/**
 * Hashes a refresh token with a full-length SHA-256 digest (Web Crypto) — the
 * value stored in the sessions table.
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
