import { sql } from "drizzle-orm";
import { Hono } from "hono";
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
	.get("/", (c) => c.json({ status: "ok", message: "API is healthy!" }))
	.get("/ready", async (c) => {
		try {
			await db.execute(sql`SELECT 1`);
			return c.json({ status: "ready" });
		} catch {
			return c.json({ status: "not ready" }, 503);
		}
	});

export default healthRouter;
