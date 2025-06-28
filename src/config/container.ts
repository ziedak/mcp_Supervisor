import 'reflect-metadata';
import { Container } from 'inversify';
import { ILogger } from '../core/interfaces/ILogger';
import { Logger } from '../core/services/Logger';
import { TYPES } from './types';

import {
  IMcpServerConfig,
  IMcpWorkspaceSupervisor,
} from '../core/interfaces/IMcpWorkspaceSupervisor';
import { McpWorkspaceSupervisor } from '../core/services/McpWorkspaceSupervisor';

// Import new interfaces
import { IRuleEngine } from '../core/interfaces/IRuleEngine';
import { IPlanValidator } from '../core/interfaces/IPlanValidator';
import { IWorkValidator } from '../core/interfaces/IWorkValidator';
import { IPromptEnricher } from '../core/interfaces/IPromptEnricher';
import { IContextStore } from '../core/interfaces/IContextStore';
import { IMCPHandler } from '../core/interfaces/IMCPHandler';
import { IAuditLogService } from '../core/interfaces/IAuditLogService';

// Import new services
import { RuleEngine } from '../core/services/RuleEngine';
import { PlanValidator } from '../core/services/PlanValidator';
import { WorkValidator } from '../core/services/WorkValidator';
import { PromptEnricher } from '../core/services/PromptEnricher';
import { ContextStore } from '../core/services/ContextStore';
import { MCPHandler } from '../core/services/MCPHandler';
import { AuditLogService } from '../core/services/AuditLogService';
import {
  ConfigurationManager,
  IConfigurationManager,
} from '../core/services/ConfigurationManager';
import {
  PluginManager,
  PluginRegistry,
  IPluginManager,
  IPluginRegistry,
} from '../core/services/PluginManager';
import {
  RuleExecutorFactory,
  IRuleExecutorFactory,
} from '../core/services/RuleExecutors';

/**
 * Singleton container instance for dependency injection
 */
const container = new Container({
  defaultScope: 'Singleton',
  skipBaseClassChecks: false,
});

// Configure server details
const serverConfig: IMcpServerConfig = {
  name: 'mcp-workspace-Supervisor',
  version: '1.0.0',
};

// Phase 1 service bindings
container.bind<ILogger>(TYPES.Logger).to(Logger);
container
  .bind<IMcpServerConfig>(TYPES.McpServerConfig)
  .toConstantValue(serverConfig);

// New RuleEngine architecture services
container
  .bind<IConfigurationManager>(TYPES.ConfigurationManager)
  .to(ConfigurationManager)
  .inSingletonScope();
container.bind<IPluginRegistry>(TYPES.PluginRegistry).to(PluginRegistry);
container.bind<IPluginManager>(TYPES.PluginManager).to(PluginManager);
container
  .bind<IRuleExecutorFactory>(TYPES.RuleExecutorFactory)
  .to(RuleExecutorFactory);

// Register services (updated RuleEngine with new dependencies)
container.bind<IRuleEngine>(TYPES.RuleEngine).to(RuleEngine);
console.log('[DI] Bound RuleEngine:', container.isBound(TYPES.RuleEngine));
container.bind<IPlanValidator>(TYPES.PlanValidator).to(PlanValidator);
container.bind<IWorkValidator>(TYPES.WorkValidator).to(WorkValidator);
container.bind<IPromptEnricher>(TYPES.PromptEnricher).to(PromptEnricher);
container.bind<IContextStore>(TYPES.ContextStore).to(ContextStore);
container.bind<IMCPHandler>(TYPES.MCPHandler).to(MCPHandler);
container.bind<IAuditLogService>(TYPES.AuditLogService).to(AuditLogService);

container
  .bind<IMcpWorkspaceSupervisor>(TYPES.McpWorkspaceSupervisor)
  .to(McpWorkspaceSupervisor);

// Export the singleton container instance
// console.log('[DI] All bindings:', container._bindingDictionary?._map ? Array.from(container._bindingDictionary._map.keys()) : 'Unavailable');
export { container };
