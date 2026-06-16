import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { db } from "@/shared/configs/database";

/**
 * @file Health routes (`/api/health`).
 *
 * - `GET /api/health`        — liveness: the process is up and serving.
 * - `GET /api/health/ready`  — readiness: dependencies (the database) are reachable.
 *
 * Splitting liveness from readiness lets orchestrators restart a hung process
 * without taking it out of rotation merely because a dependency blipped.
 */
const healthRouter = new Hono()
	.get(
		"/",
		describeRoute({
			description: "Liveness probe — the process is up and serving.",
			tags: ["Health"],
			responses: { 200: { description: "Service is healthy" } },
		}),
		(c) => c.json({ status: "ok", message: "API is healthy!" }),
	)
	.get(
		"/ready",
		describeRoute({
			description: "Readiness probe — checks database connectivity.",
			tags: ["Health"],
			responses: {
				200: { description: "Ready" },
				503: { description: "Not ready" },
			},
		}),
		async (c) => {
			try {
				await db.execute(sql`SELECT 1`);
				return c.json({ status: "ready" });
			} catch {
				return c.json({ status: "not ready" }, 503);
			}
		},
	);

export default healthRouter;
