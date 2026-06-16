import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { BadRequestError } from "./api-error";
import { errorHandler } from "./error-handler";

describe("errorHandler", () => {
	it("returns a generic 500 for unknown (non-Api) errors", async () => {
		const app = new Hono().get("/boom", () => {
			throw new Error("boom");
		});
		app.onError(errorHandler);

		const res = await app.request("/boom");
		expect(res.status).toBe(500);
		expect(await res.json()).toEqual({
			success: false,
			message: "Internal Server Error",
		});
	});

	it("formats an ApiError with its status code and message", async () => {
		const app = new Hono().get("/bad", () => {
			throw new BadRequestError("nope");
		});
		app.onError(errorHandler);

		const res = await app.request("/bad");
		expect(res.status).toBe(400);
		expect(await res.json()).toEqual({ success: false, message: "nope" });
	});
});
