import 'reflect-metadata';
import { Container, ContainerModule } from 'inversify';
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
import type { IContextPersistence } from '../core/interfaces/IContextPersistence';

// Import new services
import { RuleEngine } from '../core/services/RuleEngine';
import { PlanValidator } from '../core/services/PlanValidator';
import { WorkValidator } from '../core/services/WorkValidator';
import { PromptEnricher } from '../core/services/PromptEnricher';
import { ContextStore } from '../core/services/ContextStore';
import { MCPHandler } from '../core/services/MCPHandler';
import { AuditLogService } from '../core/services/AuditLogService';
import { FileContextPersistence } from '../core/services/FileContextPersistence';
import {
  ConfigurationManager,
  IConfigurationManager,
  ConfigurationManagerFactory,
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
import { WorkspaceManager } from '../core/services/WorkspaceManager';
import { IWorkspaceManager } from '../core/interfaces/IWorkspaceManager';

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

// Utility/Stateless classes: direct instantiation (no DI binding needed)
// Example: If you have stateless helpers, import and use them directly in services.
// import { SomeUtility } from '../utils/SomeUtility';
// (No container.bind for these)

// Group DI bindings using container modules for clarity and maintainability
import { interfaces } from 'inversify';

// Only bind services that require DI (stateful, have dependencies, or need to be mocked)
const coreModule = new ContainerModule((bind: interfaces.Bind) => {
  // Logger and config
  container.bind<ILogger>(TYPES.Logger).toDynamicValue(() => new Logger());
  container
    .bind<IMcpServerConfig>(TYPES.McpServerConfig)
    .toConstantValue(serverConfig);

  // Core services (stateful, have dependencies)
  bind<IConfigurationManager>(TYPES.ConfigurationManager)
    .to(ConfigurationManager)
    .inSingletonScope();
  bind<IPluginRegistry>(TYPES.PluginRegistry).to(PluginRegistry);
  bind<IPluginManager>(TYPES.PluginManager).to(PluginManager);
  bind<IRuleExecutorFactory>(TYPES.RuleExecutorFactory).to(RuleExecutorFactory);
  bind<IRuleEngine>(TYPES.RuleEngine).to(RuleEngine);
  bind<IPlanValidator>(TYPES.PlanValidator).to(PlanValidator);
  bind<IWorkValidator>(TYPES.WorkValidator).to(WorkValidator);
  bind<IPromptEnricher>(TYPES.PromptEnricher).to(PromptEnricher);
  bind<IContextPersistence>(TYPES.ContextPersistence)
    .to(FileContextPersistence)
    .inSingletonScope();
  bind<IContextStore>(TYPES.ContextStore)
    .toDynamicValue(ctx => {
      const persistence = ctx.container.get<IContextPersistence>(
        TYPES.ContextPersistence
      );
      const store = new ContextStore(persistence);
      // Optionally, initialize on startup
      store.initialize?.();
      return store;
    })
    .inSingletonScope();
  bind<IMCPHandler>(TYPES.MCPHandler).to(MCPHandler);
  bind<IAuditLogService>(TYPES.AuditLogService).to(AuditLogService);
  bind<IWorkspaceManager>(TYPES.WorkspaceManager)
    .to(WorkspaceManager)
    .inSingletonScope();
  bind<ConfigurationManagerFactory>(
    TYPES.ConfigurationManagerFactory
  ).toFactory<ConfigurationManager>(context => {
    return () =>
      context.container.get<ConfigurationManager>(TYPES.ConfigurationManager);
  });
  bind<IMcpWorkspaceSupervisor>(TYPES.McpWorkspaceSupervisor).to(
    McpWorkspaceSupervisor
  );
});

container.load(coreModule);

// Export the singleton container instance
export { container };
