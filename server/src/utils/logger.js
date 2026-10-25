import winston from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Development human-readable console format
const devFormat = printf(({ level, message, timestamp, stack, requestId, ...meta }) => {
  const reqStr = requestId ? ` [Req: ${requestId}]` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level}${reqStr}: ${stack || message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true })
  ),
  transports: [
    new winston.transports.Console({
      format: env.NODE_ENV === 'development' 
        ? combine(colorize(), devFormat)
        : json(),
    }),
  ],
  exitOnError: false,
});
