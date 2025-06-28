import { McpWorkspaceSupervisor } from '../../src/core/services/McpWorkspaceSupervisor';
import { MockLogger } from '../mocks/MockLogger';
import type { IMcpServerConfig } from '../../src/core/interfaces/IMcpWorkspaceSupervisor';

describe('McpWorkspaceSupervisor', () => {
  let mcpWorkspaceSupervisor: McpWorkspaceSupervisor;
  let mockLogger: MockLogger;
  let mockConfig: IMcpServerConfig;

  beforeEach(() => {
    // Create mock dependencies
    mockLogger = new MockLogger();
    mockConfig = {
      name: 'mcp-supervisor',
      version: '1.0.0',
    };

    // Create test instance
    mcpWorkspaceSupervisor = new McpWorkspaceSupervisor(mockLogger, mockConfig);
  });

  describe('Basic Functionality', () => {
    it('should create instance', () => {
      expect(mcpWorkspaceSupervisor).toBeDefined();
      expect(mcpWorkspaceSupervisor).toBeInstanceOf(McpWorkspaceSupervisor);
    });

    it('should have required methods', () => {
      expect(typeof mcpWorkspaceSupervisor.initialize).toBe('function');
      expect(typeof mcpWorkspaceSupervisor.getLogger).toBe('function');
      expect(typeof mcpWorkspaceSupervisor.getConfig).toBe('function');
    });

    it('should return logger instance', () => {
      const logger = mcpWorkspaceSupervisor.getLogger();
      expect(logger).toBe(mockLogger);
    });

    it('should return config instance', () => {
      const config = mcpWorkspaceSupervisor.getConfig();
      expect(config).toBe(mockConfig);
    });

    it('should initialize without throwing', async () => {
      await expect(
        mcpWorkspaceSupervisor.initialize('/test/path')
      ).resolves.toBeUndefined();
    });
  });
});
