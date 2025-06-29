import { container } from '../../src/config/container';
import { TYPES } from '../../src/config/types';
import { IRuleEngine } from '../../src/core/interfaces/IRuleEngine';
import { IPlanValidator } from '../../src/core/interfaces/IPlanValidator';
import { IWorkValidator } from '../../src/core/interfaces/IWorkValidator';
import { IPromptEnricher } from '../../src/core/interfaces/IPromptEnricher';
import { IContextStore } from '../../src/core/interfaces/IContextStore';
import { IMCPHandler } from '../../src/core/interfaces/IMCPHandler';
import { IAuditLogService } from '../../src/core/interfaces/IAuditLogService';
import {
  IPluginManager,
  IPluginRegistry,
} from '../../src/core/services/PluginManager';
import { IRuleExecutorFactory } from '../../src/core/services/RuleExecutors';
import { IWorkspaceManager } from '../../src/core/interfaces/IWorkspaceManager';
import { IMcpWorkspaceSupervisor } from '../../src/core/interfaces/IMcpWorkspaceSupervisor';

describe('DI Container Service Happy Path Scenarios', () => {
  it('should resolve RuleEngine and allow config/phase execution', () => {
    const ruleEngine = container.get<IRuleEngine>(TYPES.RuleEngine);
    expect(ruleEngine).toBeDefined();
    expect(typeof ruleEngine.loadConfig).toBe('function');
    expect(typeof ruleEngine.getConfig).toBe('function');
    expect(typeof ruleEngine.executePhase).toBe('function');
  });

  it('should resolve PlanValidator and support plan validation', () => {
    const validator = container.get<IPlanValidator>(TYPES.PlanValidator);
    expect(validator).toBeDefined();
    // PlanValidator interface is large, check for a representative method
    expect(typeof validator['validatePlan']).toBe('function');
  });

  it('should resolve WorkValidator and support work validation', () => {
    const validator = container.get<IWorkValidator>(TYPES.WorkValidator);
    expect(validator).toBeDefined();
    expect(typeof validator['validateWork']).toBe('function');
    expect(typeof validator['detectHallucinations']).toBe('function');
  });

  it('should resolve PromptEnricher and support enrichment/validation', () => {
    const enricher = container.get<IPromptEnricher>(TYPES.PromptEnricher);
    expect(enricher).toBeDefined();
    expect(typeof enricher['enrichPrompt']).toBe('function');
    expect(typeof enricher['validateWork']).toBe('function');
    expect(typeof enricher['shouldEnforceRules']).toBe('function');
  });

  it('should resolve MCPHandler and expose response methods', () => {
    const handler = container.get<IMCPHandler>(TYPES.MCPHandler);
    expect(handler).toBeDefined();
    // IMCPHandler is large, check for a representative method
    expect(typeof handler['handleListTools']).toBe('function');
  });

  it('should resolve AuditLogService and expose log/history', () => {
    const audit = container.get<IAuditLogService>(TYPES.AuditLogService);
    expect(audit).toBeDefined();
    expect(typeof audit['log']).toBe('function');
    expect(typeof audit['getHistory']).toBe('function');
  });

  it('should resolve PluginManager and manage plugins', () => {
    const manager = container.get<IPluginManager>(TYPES.PluginManager);
    expect(manager).toBeDefined();
    expect(typeof manager['loadPlugin']).toBe('function');
    expect(typeof manager['listPlugins']).toBe('function');
  });

  it('should resolve PluginRegistry and list plugins', () => {
    const registry = container.get<IPluginRegistry>(TYPES.PluginRegistry);
    expect(registry).toBeDefined();
    expect(typeof registry['list']).toBe('function');
    expect(typeof registry['register']).toBe('function');
  });

  it('should resolve RuleExecutorFactory and create executors', () => {
    const factory = container.get<IRuleExecutorFactory>(
      TYPES.RuleExecutorFactory
    );
    expect(factory).toBeDefined();
    expect(typeof factory['createExecutor']).toBe('function');
    expect(typeof factory['getAvailableTypes']).toBe('function');
  });

  it('should resolve WorkspaceManager and switch workspaces', () => {
    const wm = container.get<IWorkspaceManager>(TYPES.WorkspaceManager);
    expect(wm).toBeDefined();
    expect(typeof wm['switchWorkspace']).toBe('function');
    expect(typeof wm['getActiveWorkspacePath']).toBe('function');
  });

  it('should resolve McpWorkspaceSupervisor and expose core methods', () => {
    const supervisor = container.get<IMcpWorkspaceSupervisor>(
      TYPES.McpWorkspaceSupervisor
    );
    expect(supervisor).toBeDefined();
    expect(typeof supervisor['initialize']).toBe('function');
    expect(typeof supervisor['getLogger']).toBe('function');
    expect(typeof supervisor['getConfig']).toBe('function');
    expect(typeof supervisor['getWorkspaceInfo']).toBe('function');
    expect(typeof supervisor['getAuditLogService']).toBe('function');
  });
});
