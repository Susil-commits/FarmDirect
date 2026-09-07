import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.isDev ? 'debug' : 'info',
  transport: env.isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    env: env.nodeEnv,
  },
});

export const createRequestLogger = (requestId?: string) => {
  return logger.child({ requestId });
};

export default logger;
