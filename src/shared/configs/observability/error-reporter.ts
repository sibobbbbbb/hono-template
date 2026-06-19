import { logger } from "@/shared/configs/logger";

/**
 * Context attached to a reported error, useful for correlating with logs and
 * traces (e.g. the request id echoed back to the client).
 */
export interface ErrorReportContext {
	requestId?: string;
	method?: string;
	url?: string;
	statusCode: number;
}

/** A sink for unhandled / 5xx errors (e.g. Sentry, an OTLP log exporter). */
export type ErrorReporter = (
	err: Error,
	ctx: ErrorReportContext,
) => void | Promise<void>;

let reporter: ErrorReporter | null = null;

/**
 * Register the process-wide error reporter (replaces any previous one). Pass
 * `null` to disable. Wire this up at startup, e.g.:
 *
 * ```ts
 * setErrorReporter((err, ctx) => Sentry.captureException(err, { extra: ctx }));
 * ```
 */
export function setErrorReporter(fn: ErrorReporter | null): void {
	reporter = fn;
}

/**
 * Forward an error to the registered reporter. Never throws and never rejects —
 * a failing reporter must not take down request handling, so errors from the
 * reporter itself are only logged.
 */
export function reportError(err: Error, ctx: ErrorReportContext): void {
	if (!reporter) return;
	try {
		const result = reporter(err, ctx);
		if (result instanceof Promise) {
			result.catch((e: unknown) => {
				logger.error(
					{ err: { message: (e as Error).message } },
					"Error reporter rejected",
				);
			});
		}
	} catch (e) {
		logger.error(
			{ err: { message: (e as Error).message } },
			"Error reporter threw",
		);
	}
}
