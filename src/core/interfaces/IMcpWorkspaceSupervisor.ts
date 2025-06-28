import { ILogger } from './ILogger';

/**
 * Interface for MCP server configuration
 */
export interface IMcpServerConfig {
  name: string;
  version: string;
}

/**
 * Interface for MCP workspace Supervisor service
 */
export interface IMcpWorkspaceSupervisor {
  /**
   * Initialize the workspace Supervisor
   * @param workspacePath - Path to workspace
   * @returns Promise resolving when initialization completes
   */
  initialize(workspacePath: string): Promise<void>;

  /**
   * Get the logger instance
   */
  getLogger(): ILogger;

  /**
   * Get the MCP server configuration
   */
  getConfig(): IMcpServerConfig;

  /**
   * Get workspace metadata/info (name, path, type, etc.)
   */
  getWorkspaceInfo(): Record<string, unknown>;

  /**
   * Get the audit log service
   */
  getAuditLogService(): { getHistory: () => any[] };

  /**
   * Get recent rule execution results
   */
  getRecentRuleResults(): any[];

  /**
   * Get the rule engine instance
   */
  getRuleEngine?(): any;

  /**
   * Get the configuration manager instance
   */
  getConfigManager?(): any;

  /**
   * Get the plugin manager instance
   */
  getPluginManager?(): any;

  /**
   * Get the context store instance
   */
  getContextStore?(): any;
}
