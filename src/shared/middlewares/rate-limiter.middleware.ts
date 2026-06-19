import type { Context } from "hono";
import { getConnInfo } from "hono/bun";
import { rateLimiter } from "hono-rate-limiter";
import { env } from "@/shared/configs/environment";
import { createRedisStore } from "./rate-limit-store";

/**
 * Returns a `{ store }` partial for a limiter. When `REDIS_URL` is set, hits are
 * counted in a namespaced Redis keyspace (shared across instances); otherwise
 * the empty object lets `hono-rate-limiter` fall back to its in-memory store.
 */
const sharedStore = (namespace: string) =>
	env.REDIS_URL ? { store: createRedisStore(env.REDIS_URL, namespace) } : {};

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
 * Uses the in-memory store by default (correct for a single instance). Set
 * `REDIS_URL` to make the count consistent across processes/instances.
 */
export const authLimiter = rateLimiter({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	message:
		"Too many authentication attempts from this IP, please try again after 15 minutes",
	keyGenerator,
	...sharedStore("auth"),
});

/** General limiter for most API endpoints. */
export const generalApiLimiter = rateLimiter({
	windowMs: 60 * 1000,
	limit: 100,
	message: "Too many requests, please slow down.",
	keyGenerator,
	...sharedStore("general"),
});
