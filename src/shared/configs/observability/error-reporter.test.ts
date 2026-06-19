import { afterEach, describe, expect, it } from "bun:test";
import {
	type ErrorReportContext,
	reportError,
	setErrorReporter,
} from "./error-reporter";

afterEach(() => setErrorReporter(null));

describe("error reporter", () => {
	it("is a no-op when no reporter is registered", () => {
		expect(() =>
			reportError(new Error("x"), { statusCode: 500 }),
		).not.toThrow();
	});

	it("forwards the error and context to the registered reporter", () => {
		const calls: Array<{ err: Error; ctx: ErrorReportContext }> = [];
		setErrorReporter((err, ctx) => {
			calls.push({ err, ctx });
		});

		const e = new Error("boom");
		const ctx: ErrorReportContext = {
			statusCode: 503,
			requestId: "req-1",
			method: "GET",
			url: "/x",
		};
		reportError(e, ctx);

		expect(calls.length).toBe(1);
		expect(calls[0]?.err).toBe(e);
		expect(calls[0]?.ctx).toEqual(ctx);
	});

	it("swallows a reporter that throws", () => {
		setErrorReporter(() => {
			throw new Error("reporter failed");
		});
		expect(() =>
			reportError(new Error("x"), { statusCode: 500 }),
		).not.toThrow();
	});
});
