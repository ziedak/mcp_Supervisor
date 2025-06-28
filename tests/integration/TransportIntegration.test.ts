import { startMcpServer } from '../../src/index';
import { TransportFactory } from '../../src/adapters/transport/TransportFactory';
import { container } from '../../src/config/container';
import { TYPES } from '../../src/config/types';
import { IMcpWorkspaceSupervisor } from '../../src/core/interfaces/IMcpWorkspaceSupervisor';
import * as path from 'path';
import * as fs from 'fs';

describe('Transport Integration', () => {
  // Increase timeout for integration tests
  jest.setTimeout(15000);

  let tempDir: string;
  let workspaceSupervisor: IMcpWorkspaceSupervisor;
  let activeTransports: Array<{
    disconnect: () => Promise<void>;
    isConnected?: () => boolean;
  }> = [];

  beforeEach(async () => {
    // Create a temporary test workspace
    tempDir = path.join(__dirname, '../fixtures/temp-integration-workspace');

    // Ensure clean state
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    fs.mkdirSync(tempDir, { recursive: true });

    // Create some test files
    fs.writeFileSync(
      path.join(tempDir, 'test.ts'),
      `export class TestClass {
				public method(): string {
					return "test";
				}
			}`
    );

    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-workspace', version: '1.0.0' })
    );

    // Get workspace Supervisor from container
    workspaceSupervisor = container.get<IMcpWorkspaceSupervisor>(
      TYPES.McpWorkspaceSupervisor
    );
    await workspaceSupervisor.initialize(tempDir);

    // Reset active transports
    activeTransports = [];
  });

  afterEach(async () => {
    // Clean up all active transports with proper error handling and timing
    const cleanupPromises = activeTransports.map(async transport => {
      try {
        if (transport.isConnected && transport.isConnected()) {
          await transport.disconnect();
          // Add a small delay to ensure the server is fully closed
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        // Ignore cleanup errors but log them for debugging
        console.warn('Error during transport cleanup:', error);
      }
    });

    await Promise.all(cleanupPromises);
    activeTransports = [];

    // Clean up filesystem
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Transport Factory Integration', () => {
    it('should create and use stdio transport successfully', async () => {
      const transport = TransportFactory.create('stdio');
      expect(transport.getType()).toBe('stdio');
      expect(transport.isConnected()).toBe(false);
      expect(transport.getAddress?.()).toBeNull();
    });

    it('should create and use http transport successfully', async () => {
      const transport = TransportFactory.create('http', {
        http: {
          port: 0, // Use port 0 to let the system choose an available port
          host: 'localhost',
        },
      });

      expect(transport.getType()).toBe('http');
      expect(transport.isConnected()).toBe(false);
    });

    it('should validate supported transport types', () => {
      const types = TransportFactory.getSupportedTypes();
      expect(types).toContain('stdio');
      expect(types).toContain('http');
      expect(types.length).toBe(2);
    });
  });

  describe('Start MCP Server Integration', () => {
    it('should start MCP server with stdio transport', async () => {
      const result = await startMcpServer(workspaceSupervisor, 'stdio');

      expect(result.server).toBeDefined();
      expect(result.transport).toBeDefined();
      expect(result.transport.getType()).toBe('stdio');
      expect(result.transport.isConnected()).toBe(true);

      // Clean up
      await result.transport.disconnect();
      expect(result.transport.isConnected()).toBe(false);
    });

    it('should start MCP server with default transport when none specified', async () => {
      const result = await startMcpServer(workspaceSupervisor);

      expect(result.server).toBeDefined();
      expect(result.transport).toBeDefined();
      expect(result.transport.getType()).toBe('stdio');

      // Track for cleanup
      activeTransports.push(result.transport);

      // Clean up
      await result.transport.disconnect();
    });

    it.skip('should start MCP server with HTTP transport', async () => {
      // Skip this test in integration to avoid open handles
      // HTTP transport is tested separately in unit tests
      const result = await startMcpServer(workspaceSupervisor, 'http', {
        http: {
          port: 0, // Use port 0 for dynamic port allocation
          host: 'localhost',
        },
      });

      expect(result.server).toBeDefined();
      expect(result.transport).toBeDefined();
      expect(result.transport.getType()).toBe('http');
      expect(result.transport.isConnected()).toBe(true);

      const address = result.transport.getAddress?.();
      expect(address).toBeDefined();
      expect(address?.host).toBe('localhost');
      expect(address?.port).toBeGreaterThan(0);

      // Track for cleanup
      activeTransports.push(result.transport);

      // Clean up
      await result.transport.disconnect();
      expect(result.transport.isConnected()).toBe(false);
    });

    it('should handle transport configuration errors', async () => {
      await expect(
        startMcpServer(workspaceSupervisor, 'http') // Missing required HTTP config
      ).rejects.toThrow('HTTP transport requires configuration options');
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full workspace analysis and server startup', async () => {
      // Start server with the analyzed workspace
      const result = await startMcpServer(workspaceSupervisor, 'stdio');

      expect(result.server).toBeDefined();
      expect(result.transport.isConnected()).toBe(true);

      // Verify basic functionality
      expect(workspaceSupervisor.getLogger()).toBeDefined();
      expect(workspaceSupervisor.getConfig()).toBeDefined();

      // Track for cleanup
      activeTransports.push(result.transport);

      // Clean up
      await result.transport.disconnect();
    });

    it('should handle graceful shutdown', async () => {
      const result = await startMcpServer(workspaceSupervisor, 'stdio');

      expect(result.transport.isConnected()).toBe(true);

      // Track for cleanup
      activeTransports.push(result.transport);

      // Simulate graceful shutdown
      await result.transport.disconnect();

      expect(result.transport.isConnected()).toBe(false);
    });
  });
});
