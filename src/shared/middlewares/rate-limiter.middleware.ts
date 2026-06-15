import type { Context } from "hono";
import { getConnInfo } from "hono/bun";
import { rateLimiter } from "hono-rate-limiter";

/**
 * Derives a rate-limit key from the client IP.
 *
 * Takes only the first hop of `x-forwarded-for` (the closest client) and
 * falls back to the connection's remote address. NOTE: `x-forwarded-for` is
 * client-controlled — only trust it behind a proxy you operate.
 */
const keyGenerator = (c: Context): string => {
	const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
	return forwarded || getConnInfo(c).remote.address || "unknown_ip";
};

/**
 * Strict limiter for sensitive endpoints (login, register).
 *
 * Uses the default in-memory store — correct for a single instance. For
 * multi-instance / serverless deployments, plug in a shared store (e.g. Redis)
 * so the count is consistent across processes.
 */
export const authLimiter = rateLimiter({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	message:
		"Too many authentication attempts from this IP, please try again after 15 minutes",
	keyGenerator,
});

/** General limiter for most API endpoints. */
export const generalApiLimiter = rateLimiter({
	windowMs: 60 * 1000,
	limit: 100,
	message: "Too many requests, please slow down.",
	keyGenerator,
});
