import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { registerMcpResources } from '../../../src/adapters/mcp/resources';

// Mocks
const mockServer = {
  registerResource: jest.fn(),
};
const mockSupervisor = {
  getLogger: () => ({
    debug: jest.fn(),
    error: jest.fn(),
  }),
  getWorkspaceInfo: jest.fn(() => ({ id: 'ws1', name: 'Test Workspace' })),
  getAuditLogService: jest.fn(() => ({
    getHistory: jest.fn(() => [{ id: 1 }]),
  })),
  getConfig: jest.fn(() => ({ config: true })),
  getRecentRuleResults: jest.fn(() => [{ rule: 'r1', timestamp: Date.now() }]),
  getPluginManager: jest.fn(() => ({
    listPlugins: jest.fn(() => ['pluginA']),
  })),
  getContextStore: jest.fn(() => ({
    query: jest.fn(() => Promise.resolve([{ ctx: 1 }])),
  })),
};

describe('MCP Resources Adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers workspace-info resource and handler returns workspace info', async () => {
    registerMcpResources(mockServer as any, mockSupervisor as any);
    // Find the registration for workspace-info
    const call = mockServer.registerResource.mock.calls.find(
      c => c[0] === 'workspace-info'
    );
    expect(call).toBeDefined();
    const handler = call[3];
    const result = await handler(new URL('workspace://info'));
    expect(result.contents[0]).toEqual({ id: 'ws1', name: 'Test Workspace' });
  });

  it('registers audit-log resource and handler returns audit log', async () => {
    registerMcpResources(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerResource.mock.calls.find(
      c => c[0] === 'audit-log'
    );
    expect(call).toBeDefined();
    const handler = call[3];
    const url = new URL('workspace://audit-log');
    const result = await handler(url);
    expect(Array.isArray(result.contents[0])).toBe(true);
    expect(result.contents[0][0]).toEqual({ id: 1 });
  });

  it('registers workspace-config resource and handler returns config', async () => {
    registerMcpResources(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerResource.mock.calls.find(
      c => c[0] === 'workspace-config'
    );
    expect(call).toBeDefined();
    const handler = call[3];
    const url = new URL('workspace://config');
    const result = await handler(url);
    expect(result.contents[0]).toEqual({ config: true });
  });

  it('registers rule-results resource and handler returns rule results', async () => {
    registerMcpResources(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerResource.mock.calls.find(
      c => c[0] === 'rule-results'
    );
    expect(call).toBeDefined();
    const handler = call[3];
    const url = new URL('workspace://rule-results');
    const result = await handler(url);
    expect(Array.isArray(result.contents[0])).toBe(true);
    expect(result.contents[0][0].rule).toBe('r1');
  });

  it('registers plugin-info resource and handler returns plugin list', async () => {
    registerMcpResources(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerResource.mock.calls.find(
      c => c[0] === 'plugin-info'
    );
    expect(call).toBeDefined();
    const handler = call[3];
    const url = new URL('workspace://plugins');
    const result = await handler(url);
    expect(Array.isArray(result.contents[0])).toBe(true);
    expect(result.contents[0][0]).toBe('pluginA');
  });

  it('registers user-context resource and handler returns context entries', async () => {
    registerMcpResources(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerResource.mock.calls.find(
      c => c[0] === 'user-context'
    );
    expect(call).toBeDefined();
    const handler = call[3];
    const url = new URL('workspace://context');
    const result = await handler(url);
    expect(Array.isArray(result.contents[0])).toBe(true);
    expect(result.contents[0][0]).toEqual({ ctx: 1 });
  });
});
