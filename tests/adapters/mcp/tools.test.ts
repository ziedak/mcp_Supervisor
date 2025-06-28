import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { registerMcpTools } from '../../../src/adapters/mcp/tools';

// Mocks
const mockServer = {
  registerTool: jest.fn(),
};
const mockSupervisor = {
  getLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
  }),
  getRuleEngine: jest.fn(() => ({
    executeRule: jest.fn(() => ({ result: 'ok' })),
  })),
  getConfigManager: jest.fn(() => ({ validateConfig: jest.fn() })),
  getConfig: jest.fn(() => ({ config: true })),
  getAuditLogService: jest.fn(() => ({
    getHistory: jest.fn(() => [{ id: 1 }]),
  })),
  getRecentRuleResults: jest.fn(() => [{ rule: 'r1', timestamp: Date.now() }]),
  getPluginManager: jest.fn(() => ({
    listPlugins: jest.fn(() => ['pluginA']),
    unloadPlugin: jest.fn(() => Promise.resolve()),
    loadPlugin: jest.fn(() => Promise.resolve()),
  })),
  getContextStore: jest.fn(() => ({
    queryAll: jest.fn(() => Promise.resolve([{ ctx: 1 }])),
    set: jest.fn(() => Promise.resolve()),
  })),
};

describe('MCP Tools Adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers scan-workspace tool', () => {
    registerMcpTools(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerTool.mock.calls.find(
      c => c[0] === 'scan-workspace'
    );
    expect(call).toBeDefined();
    expect(typeof call[2]).toBe('function');
  });

  it('registers run-rule tool', async () => {
    registerMcpTools(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerTool.mock.calls.find(
      c => c[0] === 'run-rule'
    );
    expect(call).toBeDefined();
    const handler = call[2];
    const result = await handler({ ruleId: 'r1', params: { foo: 'bar' } });
    expect(result.content[0].type).toBe('json');
  });

  it('registers validate-config tool', async () => {
    registerMcpTools(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerTool.mock.calls.find(
      c => c[0] === 'validate-config'
    );
    expect(call).toBeDefined();
    const handler = call[2];
    const result = await handler({});
    expect(result.content[0].type).toBe('json');
  });

  it('registers get-audit-history tool', async () => {
    registerMcpTools(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerTool.mock.calls.find(
      c => c[0] === 'get-audit-history'
    );
    expect(call).toBeDefined();
    const handler = call[2];
    const result = await handler({});
    expect(result.content[0].type).toBe('json');
    expect(Array.isArray(result.content[0].data)).toBe(true);
  });

  it('registers get-rule-results tool', async () => {
    registerMcpTools(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerTool.mock.calls.find(
      c => c[0] === 'get-rule-results'
    );
    expect(call).toBeDefined();
    const handler = call[2];
    const result = await handler({});
    expect(result.content[0].type).toBe('json');
    expect(Array.isArray(result.content[0].data)).toBe(true);
  });

  it('registers list-plugins tool', async () => {
    registerMcpTools(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerTool.mock.calls.find(
      c => c[0] === 'list-plugins'
    );
    expect(call).toBeDefined();
    const handler = call[2];
    const result = await handler({});
    expect(result.content[0].type).toBe('json');
    expect(Array.isArray(result.content[0].data)).toBe(true);
    expect(result.content[0].data[0]).toBe('pluginA');
  });

  it('registers reload-plugin tool', async () => {
    registerMcpTools(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerTool.mock.calls.find(
      c => c[0] === 'reload-plugin'
    );
    expect(call).toBeDefined();
    const handler = call[2];
    const result = await handler({ pluginId: 'pluginA' });
    expect(result.content[0].data.reloaded).toBe(true);
    expect(result.content[0].data.pluginId).toBe('pluginA');
  });

  it('registers get-context tool', async () => {
    registerMcpTools(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerTool.mock.calls.find(
      c => c[0] === 'get-context'
    );
    expect(call).toBeDefined();
    const handler = call[2];
    const result = await handler({});
    expect(result.content[0].type).toBe('json');
    expect(Array.isArray(result.content[0].data)).toBe(true);
    expect(result.content[0].data[0]).toEqual({ ctx: 1 });
  });

  it('registers set-context tool', async () => {
    registerMcpTools(mockServer as any, mockSupervisor as any);
    const call = mockServer.registerTool.mock.calls.find(
      c => c[0] === 'set-context'
    );
    expect(call).toBeDefined();
    const handler = call[2];
    const result = await handler({ key: 'foo', value: 42 });
    expect(result.content[0].data.set).toBe(true);
    expect(result.content[0].data.key).toBe('foo');
    expect(result.content[0].data.value).toBe(42);
  });
});
