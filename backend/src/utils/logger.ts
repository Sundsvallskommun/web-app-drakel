import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import { LOG_DIR } from '@config';

// logs dir
const logDir: string = join(__dirname, LOG_DIR);

if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

// Print the stack trace when present (errors / uncaught exceptions), otherwise the message.
const printFormat = winston.format.printf(
  ({ timestamp, level, message, stack }) => `${timestamp} ${level}: ${stack || message}`,
);

/**
 * Shared format. `errors({ stack: true })` lifts an Error's stack onto the log entry so crashes are
 * logged with their full stack trace rather than just "[object Object]" / the message.
 */
const buildFormat = (colorize: boolean) =>
  winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    ...(colorize ? [winston.format.colorize()] : []),
    printFormat,
  );

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */
const logger = winston.createLogger({
  format: buildFormat(false),
  transports: [
    // debug log setting
    new winstonDaily({
      level: 'debug',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/debug', // log file /logs/debug/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      json: false,
      zippedArchive: true,
    }),
    // error log setting
    new winstonDaily({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir + '/error', // log file /logs/error/*.log in save
      filename: `%DATE%.log`,
      maxFiles: 30, // 30 Days saved
      handleExceptions: true,
      handleRejections: true,
      json: false,
      zippedArchive: true,
    }),
  ],
});

// Console — also catches uncaught exceptions and unhandled rejections, so a crashing backend prints
// its error (with stack) to stdout/stderr and not only to the error log file.
logger.add(
  new winston.transports.Console({
    handleExceptions: true,
    handleRejections: true,
    format: buildFormat(true),
  }),
);

const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

export { logger, stream };
