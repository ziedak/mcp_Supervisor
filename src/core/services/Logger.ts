import winston from 'winston';
import { ILogger } from '../interfaces/ILogger';
import { injectable } from 'inversify';

/**
 * Winston-based implementation of ILogger
 */
@injectable()
export class Logger implements ILogger {
  private readonly logger: winston.Logger;

  /**
   * Creates a new Logger instance
   * @param logLevel - The minimum log level
   */
  public constructor(logLevel: string = 'info') {
    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'mcp-workspace-Supervisor' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }

  /**
   * Log debug information
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  public debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  /**
   * Log information
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  public info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  /**
   * Log warnings
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  public warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log errors
   * @param message - The message to log
   * @param error - Error object
   * @param meta - Additional metadata
   */
  public error(
    message: string,
    error?: Error,
    meta?: Record<string, unknown>
  ): void {
    this.logger.error(message, {
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : undefined,
      ...meta,
    });
  }
}
