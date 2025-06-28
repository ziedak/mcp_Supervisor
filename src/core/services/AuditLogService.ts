import type { ILogger } from '../interfaces/ILogger';
import type {
  AuditLogEntry,
  IAuditLogService,
} from '../interfaces/IAuditLogService';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../config/types';

/**
 * AuditLogService
 * Maintains a history of decisions, validates structure, and tracks deviations.
 * Follows SOLID principles and is designed for dependency injection.
 */
@injectable()
export class AuditLogService implements IAuditLogService {
  private readonly history: AuditLogEntry[] = [];
  constructor(@inject(TYPES.Logger) private logger: ILogger) {}

  log(entry: AuditLogEntry): void {
    this.history.push(entry);
    if (this.logger) {
      this.logger.info(
        `[AUDIT] ${entry.action} by ${entry.actor} at ${new Date(entry.timestamp).toISOString()}`
      );
    }
  }

  getHistory(filter?: Partial<AuditLogEntry>): AuditLogEntry[] {
    if (!filter) return [...this.history];
    return this.history.filter(entry =>
      Object.entries(filter).every(([key, value]) =>
        value === undefined ? true : entry[key as keyof AuditLogEntry] === value
      )
    );
  }

  findDeviations(): AuditLogEntry[] {
    return this.history.filter(e => e.deviation === true);
  }

  attachLogger(logger: ILogger): void {
    this.logger = logger;
  }
}
