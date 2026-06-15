import { Hono } from "hono";
import authRouter from "@/modules/auth/auth.route";
import healthRouter from "@/modules/health/health.route";
import userRouter from "@/modules/user/user.route";

/**
 * @file Main API router.
 *
 * Aggregates the module routers under the `/api` prefix. Routers are mounted
 * via chained `.route()` calls so their types compose into the exported
 * `AppType`, powering the end-to-end typed RPC client.
 */
const api = new Hono()
	.route("/health", healthRouter)
	.route("/auth", authRouter)
	.route("/users", userRouter);

export default api;
