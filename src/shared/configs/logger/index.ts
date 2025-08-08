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
  level: 'info',
  serializers: serializers, 
};

// Pretty Printing If in Development 
if (env.NODE_ENV === 'development') {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname',
    },
  };
}

export const logger = pino(options);