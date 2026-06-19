import { env } from "@/shared/configs/environment";
import { logger } from "@/shared/configs/logger";

/**
 * Optional OpenTelemetry bootstrap. A no-op unless `OTEL_ENABLED=true`.
 *
 * The OTel SDK packages are intentionally **not** bundled with the template —
 * they are heavy and runtime-specific. Install them only when you want tracing:
 *
 * ```sh
 * bun add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
 * ```
 *
 * Then set `OTEL_ENABLED=true` and the standard `OTEL_EXPORTER_OTLP_ENDPOINT`
 * (the SDK reads the `OTEL_*` env vars itself). If the packages are missing we
 * log a warning and continue, so enabling the flag can never crash startup.
 */
export async function initTracing(): Promise<void> {
	if (!env.OTEL_ENABLED) return;

	// `: string` widens the specifier away from a literal so `tsc` does not try
	// to resolve these optional, possibly-uninstalled packages at build time.
	const sdkPkg: string = "@opentelemetry/sdk-node";
	const autoPkg: string = "@opentelemetry/auto-instrumentations-node";

	try {
		const sdkMod = (await import(sdkPkg)) as {
			NodeSDK: new (
				config: unknown,
			) => {
				start: () => void;
				shutdown: () => Promise<void>;
			};
		};
		const autoMod = (await import(autoPkg)) as {
			getNodeAutoInstrumentations: () => unknown;
		};

		const sdk = new sdkMod.NodeSDK({
			serviceName: env.OTEL_SERVICE_NAME,
			instrumentations: [autoMod.getNodeAutoInstrumentations()],
		});
		sdk.start();
		logger.info(
			{ service: env.OTEL_SERVICE_NAME },
			"OpenTelemetry tracing started",
		);

		const shutdown = () => void sdk.shutdown();
		process.on("SIGTERM", shutdown);
		process.on("SIGINT", shutdown);
	} catch (err) {
		logger.warn(
			{ err: { message: (err as Error).message } },
			"OpenTelemetry init failed — are the @opentelemetry/* packages installed?",
		);
	}
}
