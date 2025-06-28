import { ILogger } from '../../src/core/interfaces/ILogger';

/**
 * Mock implementation of ILogger for testing
 */
export class MockLogger implements ILogger {
  public logs: { level: string; message: string; error?: Error }[] = [];

  debug(message: string): void {
    this.logs.push({ level: 'debug', message });
  }

  info(message: string): void {
    this.logs.push({ level: 'info', message });
  }

  warn(message: string): void {
    this.logs.push({ level: 'warn', message });
  }

  error(message: string, error?: Error): void {
    this.logs.push({ level: 'error', message, error });
  }

  /**
   * Helper to verify if a message was logged at a specific level
   */
  hasLog(level: string, message: string): boolean {
    return this.logs.some(
      log => log.level === level && log.message.includes(message)
    );
  }

  /**
   * Helper to get all logs at a specific level
   */
  getLogsByLevel(level: string): { message: string; error?: Error }[] {
    return this.logs
      .filter(log => log.level === level)
      .map(({ message, error }) => ({ message, error }));
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }
}
