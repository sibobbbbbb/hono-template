import { createMiddleware } from "hono/factory";
import { jwt } from "hono/jwt";
import { env } from "@/shared/configs/environment";

/**
 * Authentication middleware using JWT.
 *
 * Verifies the `Authorization: Bearer <token>` header in the request.
 * If the token is valid, it attaches the payload to `c.get('jwtPayload')`.
 * If the token is invalid or missing, it throws an Unauthorized error.
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  const jwtMiddleware = jwt({
    secret: env.JWT_SECRET,
  });
  return jwtMiddleware(c, next);
});
