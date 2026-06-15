import { jwt } from "hono/jwt";
import { env } from "@/shared/configs/environment";

/**
 * JWT authentication middleware.
 *
 * Verifies the `Authorization: Bearer <token>` header and attaches the decoded
 * payload to `c.get("jwtPayload")`. Constructed once at module load (the JWT
 * middleware is reused across requests, not rebuilt per request).
 */
export const authMiddleware = jwt({ secret: env.JWT_SECRET });
