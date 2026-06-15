import { Hono } from "hono";

/**
 * @file Health check route (`/api/health`).
 *
 * A simple liveness endpoint for uptime monitoring and load-balancer probes.
 */
const healthRouter = new Hono().get("/", (c) =>
	c.json({ status: "ok", message: "API is healthy!" }),
);

export default healthRouter;
