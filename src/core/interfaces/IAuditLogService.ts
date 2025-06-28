import type { ILogger } from './ILogger';

export interface AuditLogEntry {
  timestamp: number;
  actor: string;
  action: string;
  context: Record<string, unknown>;
  result?: Record<string, unknown>;
  deviation?: boolean;
  message?: string;
}

export interface IAuditLogService {
  log(entry: AuditLogEntry): void;
  getHistory(filter?: Partial<AuditLogEntry>): AuditLogEntry[];
  findDeviations(): AuditLogEntry[];
  attachLogger(logger: ILogger): void;
}
