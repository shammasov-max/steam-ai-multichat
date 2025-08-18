import {
  createLogger,
  format,
  transports,
  Logger
} from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { isProduction } from './utils/common';

// Type definitions
type Platform = 'darwin' | 'win32' | 'linux';

type LoggerConfig = {
  readonly format: ReturnType<typeof format.combine>;
  readonly transports: readonly DailyRotateFile[];
};

type PasswordsLoggerConfig = {
  readonly levels: { readonly passwords: string };
  readonly format: ReturnType<typeof format.combine>;
  readonly transports: readonly transports.FileTransportInstance[];
};

// Platform detection
const getPlatform = (): Platform => process.platform as Platform;

const isDarwin = (): boolean => getPlatform() === 'darwin';

// Transport creation
const shouldCreateTransports = (): boolean => 
  !isDarwin() || !isProduction();

// Main logger configuration
const createMainLogger = (): Logger => {
  const loggerConfig: LoggerConfig = {
    format: format.combine(
      format.timestamp({ format: "HH:mm:ss" }),
      format.simple()
    ),
    transports: shouldCreateTransports() ? [
      new DailyRotateFile({
        dirname: "./logs",
        filename: '%DATE%.log',
        datePattern: "YYYY-MM-DD",
        maxFiles: "30d"
      })
    ] : []
  };

  return createLogger(loggerConfig);
};

// Passwords logger configuration
const createPasswordsLogger = (): Logger => {
  const passwordsConfig: PasswordsLoggerConfig = {
    levels: {
      passwords: 'passwords'
    },
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.simple()
    ),
    transports: shouldCreateTransports() ? [
      new transports.File({
        filename: "./logs/passwords.log",
        level: "passwords"
      })
    ] : []
  };

  return createLogger(passwordsConfig);
};

// Logger instances
const logger = createMainLogger();
const passwordsLogger = createPasswordsLogger();

// Development console logging
const addConsoleTransport = (): void => {
  if (!isProduction()) {
    logger.add(new transports.Console({
      format: format.simple()
    }));
  }
};

addConsoleTransport();

export {
  logger,
  passwordsLogger
};

export type {
  Logger,
  Platform,
  LoggerConfig,
  PasswordsLoggerConfig
};