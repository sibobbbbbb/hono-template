import pino from "pino";
import { env } from "@/shared/configs/environment";

/**
 * Logger configuration using Pino.
 *
 * This file sets up a Pino logger instance with custom serializers for
 * request and response objects. It also configures pretty printing in
 * development mode for easier debugging.
 *
 * @file Logger configuration for the application.
 */
const serializers = {
	req: (req: Request) => {
		return {
			method: req.method,
			url: req.url,
		};
	},
	res: (res: Response) => {
		return {
			status: res.status,
		};
	},
};

// Logger configuration
const options: pino.LoggerOptions = {
	level: env.NODE_ENV === "test" ? "silent" : "info",
	serializers: serializers,
	formatters: {
		level: (label: string) => ({
			levelLabel: label.toUpperCase(),
		}),
	},
};

// Pretty Printing If in Development
if (env.NODE_ENV === "development") {
	options.transport = {
		target: "pino-pretty",
		options: {
			colorize: true,
			translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
			singleLine: true,
			hideObject: true,
			errorProps: "message",
			levelKey: "xlevel",
			ignore: "pid,hostname,level,levelLabel,req,res,err,reqId,responseTime",
			messageFormat:
				"({levelLabel}) {res.status} {req.method} {req.url} => {msg}",
		},
	};
}

export const logger = pino(options);
