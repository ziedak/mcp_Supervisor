import { AuditLogService } from '../../../src/core/services/AuditLogService';
import type { AuditLogEntry } from '../../../src/core/interfaces/IAuditLogService';
import { TestLogger } from '../../utils/RuleEngineTestUtils';

describe('AuditLogService', () => {
  let audit: AuditLogService;
  let logger: TestLogger;

  beforeEach(() => {
    audit = new AuditLogService();
    logger = new TestLogger();
    audit.attachLogger(logger);
  });

  it('should log and retrieve audit entries', () => {
    const entry: AuditLogEntry = {
      timestamp: Date.now(),
      actor: 'user',
      action: 'commit',
      context: { message: 'Initial commit' },
    };
    audit.log(entry);
    const history = audit.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].action).toBe('commit');
  });

  it('should filter audit history', () => {
    const now = Date.now();
    audit.log({ timestamp: now, actor: 'a', action: 'x', context: {} });
    audit.log({ timestamp: now, actor: 'b', action: 'y', context: {} });
    const filtered = audit.getHistory({ actor: 'b' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].actor).toBe('b');
  });

  it('should track deviations', () => {
    audit.log({
      timestamp: Date.now(),
      actor: 'sys',
      action: 'check',
      context: {},
      deviation: true,
    });
    audit.log({
      timestamp: Date.now(),
      actor: 'sys',
      action: 'check',
      context: {},
      deviation: false,
    });
    const deviations = audit.findDeviations();
    expect(deviations.length).toBe(1);
    expect(deviations[0].deviation).toBe(true);
  });

  it('should log to attached logger', () => {
    const entry: AuditLogEntry = {
      timestamp: Date.now(),
      actor: 'user',
      action: 'commit',
      context: { message: 'msg' },
    };
    audit.log(entry);
    expect(logger.hasLogContaining('[AUDIT]', 'info')).toBe(true);
  });
});
