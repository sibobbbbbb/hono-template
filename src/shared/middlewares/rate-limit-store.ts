import { RedisClient } from "bun";
import type { ClientRateLimitInfo, ConfigType, Store } from "hono-rate-limiter";
import { logger } from "@/shared/configs/logger";

/**
 * A distributed rate-limit {@link Store} backed by Bun's built-in Redis client.
 *
 * Each limiter gets its own namespaced keyspace (`rl:<namespace>:<key>`) so that
 * the strict auth limiter and the general API limiter never share counters even
 * though they key on the same client IP.
 *
 * The counter uses `INCR` + `EXPIRE` (set only on the first hit of a window) so
 * the window slides per client. All Redis calls fail **open**: if Redis is
 * unreachable we log and let the request through rather than locking everyone
 * out on an infrastructure blip.
 */
export function createRedisStore(url: string, namespace: string): Store {
	const client = new RedisClient(url);
	let windowMs = 60_000;
	const prefix = `rl:${namespace}:`;
	const fullKey = (key: string) => prefix + key;

	return {
		// Keys live in Redis, shared across instances — not local to this process.
		localKeys: false,
		prefix,

		init(options: ConfigType) {
			windowMs = options.windowMs;
		},

		async increment(key: string): Promise<ClientRateLimitInfo> {
			const k = fullKey(key);
			try {
				const totalHits = await client.incr(k);
				if (totalHits === 1) {
					await client.expire(k, Math.ceil(windowMs / 1000));
				}
				const ttl = await client.ttl(k);
				const resetTime = new Date(
					Date.now() + (ttl > 0 ? ttl * 1000 : windowMs),
				);
				return { totalHits, resetTime };
			} catch (err) {
				logger.warn(
					{ err: { message: (err as Error).message }, key: k },
					"Redis rate-limit store unavailable; failing open",
				);
				return { totalHits: 1, resetTime: new Date(Date.now() + windowMs) };
			}
		},

		async decrement(key: string): Promise<void> {
			try {
				await client.decr(fullKey(key));
			} catch {
				// Best-effort; a missed decrement only makes limiting slightly stricter.
			}
		},

		async resetKey(key: string): Promise<void> {
			try {
				await client.del(fullKey(key));
			} catch {
				// Best-effort.
			}
		},

		shutdown() {
			client.close();
		},
	};
}
