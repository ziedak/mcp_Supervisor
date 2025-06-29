/**
 * Symbol constants for dependency injection
 */
export const TYPES = {
  Logger: Symbol.for('Logger'),
  McpServerConfig: Symbol.for('McpServerConfig'),
  McpWorkspaceSupervisor: Symbol.for('McpWorkspaceSupervisor'),
  HttpTransport: Symbol.for('HttpTransport'),
  RuleEngine: Symbol.for('RuleEngine'),
  PlanValidator: Symbol.for('PlanValidator'),
  WorkValidator: Symbol.for('WorkValidator'),
  PromptEnricher: Symbol.for('PromptEnricher'),
  ContextStore: Symbol.for('ContextStore'),
  MCPHandler: Symbol.for('MCPHandler'),
  ConfigurationManager: Symbol.for('ConfigurationManager'),
  ConfigurationManagerFactory: Symbol.for('ConfigurationManagerFactory'),
  PluginRegistry: Symbol.for('PluginRegistry'),
  PluginManager: Symbol.for('PluginManager'),
  RuleExecutorFactory: Symbol.for('RuleExecutorFactory'),
  AuditLogService: Symbol.for('AuditLogService'),
  ContextPersistence: Symbol.for('ContextPersistence'),
  WorkspaceManager: Symbol.for('WorkspaceManager'),
};
