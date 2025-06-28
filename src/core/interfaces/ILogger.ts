/**
 * Interface for logging service
 */
export interface ILogger {
  /**
   * Log debug information
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  debug(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log information
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  info(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log warnings
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  warn(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log errors
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}
