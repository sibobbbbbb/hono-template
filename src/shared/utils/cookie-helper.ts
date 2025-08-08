import { env } from "@/shared/configs/environment";
import { Context } from "hono";
import { setCookie } from "hono/cookie";
import { parseJwtExpiresIn } from "./parse-jwt-expires-in";

/**
 * @file Cookie helper functions for managing HttpOnly cookies.
 *
 * This file provides utility functions to set and clear HttpOnly cookies
 * for storing refresh tokens securely. It uses the `hono/cookie` module
 * to handle cookie operations in a Hono application.
 */

const REFRESH_TOKEN_COOKIE_NAME = env.JWT_REFRESH_COOKIE_NAME || "refreshToken";

const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "Strict" as const,
    path: "/api/auth",
};

/**
 * Set refresh token in HttpOnly cookie.
 * @param c Hono Context object.
 * @param token Refresh token to be set.
 */
export const setRefreshTokenCookie = (c: Context, token: string) => {
    setCookie(c,REFRESH_TOKEN_COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: parseJwtExpiresIn(env.JWT_REFRESH_EXPIRES_IN),
    });
};

/**
 * Remove refresh token from cookie.
 * @param c Hono Context object.
 */
export const clearRefreshTokenCookie = (c: Context) => {
    setCookie(c,REFRESH_TOKEN_COOKIE_NAME, "", {
        ...cookieOptions,
        expires: new Date(0),
    });
};