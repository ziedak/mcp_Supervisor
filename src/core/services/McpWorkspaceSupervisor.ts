import { injectable, inject } from 'inversify';
import type { ILogger } from '../interfaces/ILogger';
import type {
  IMcpWorkspaceSupervisor,
  IMcpServerConfig,
} from '../interfaces/IMcpWorkspaceSupervisor';
import { TYPES } from '../../config/types';
import type { IContextStore } from '../interfaces/IContextStore';
import type { IRuleEngine } from '../interfaces/IRuleEngine';
import type { IConfigurationManager } from './ConfigurationManager';
import type { IPluginManager } from './PluginManager';

/**
 * Main workspace Supervisor service implementation
 */
@injectable()
export class McpWorkspaceSupervisor implements IMcpWorkspaceSupervisor {
  /**
   * Creates a new McpWorkspaceSupervisor
   *
   * @param logger - Logger service
   * @param config - Server configuration
   * @param ruleEngine - Rule engine instance
   * @param configManager - Configuration manager instance
   * @param pluginManager - Plugin manager instance
   * @param contextStore - Context store instance
   */
  public constructor(
    @inject(TYPES.Logger) private readonly logger: ILogger,
    @inject(TYPES.McpServerConfig) private readonly config: IMcpServerConfig,
    @inject(TYPES.RuleEngine) private readonly ruleEngine: IRuleEngine,
    @inject(TYPES.ConfigurationManager)
    private readonly configManager: IConfigurationManager,
    @inject(TYPES.PluginManager) private readonly pluginManager: IPluginManager,
    @inject(TYPES.ContextStore) private readonly contextStore: IContextStore
  ) {}

  /**
   * Initialize the workspace Supervisor
   * @param workspacePath - Path to workspace
   */
  public async initialize(workspacePath: string): Promise<void> {
    // No-op: interface does not define plugin/context initialization methods
    this.logger.info(`Initialized workspace at: ${workspacePath}`);
  }

  /**
   * Get the logger instance
   * @returns {ILogger} Logger instance
   */
  public getLogger(): ILogger {
    return this.logger;
  }

  /**
   * Get the MCP server configuration
   * @returns {IMcpServerConfig} MCP server config
   */
  public getConfig(): IMcpServerConfig {
    return this.config;
  }

  /**
   * Get workspace metadata/info (name, path, type, etc.)
   * Returns static or default values if not available.
   * @returns {WorkspaceInfo} Workspace metadata
   */
  public getWorkspaceInfo(): {
    name: string;
    path: string;
    type: string;
    initialized: boolean;
    plugins: unknown[];
    rules: unknown[];
  } {
    return {
      name: 'Unknown',
      path: process.cwd(),
      type: 'unknown',
      initialized: true,
      plugins: [],
      rules: [],
    };
  }

  /**
   * Get the audit log service
   * Returns a stub if not available on context store.
   * @returns {object} Audit log service stub
   */
  public getAuditLogService(): { getHistory: () => unknown[] } {
    return { getHistory: () => [] };
  }

  /**
   * Get recent rule execution results
   * Returns an empty array if not available.
   * @returns {unknown[]} Recent rule results
   */
  public getRecentRuleResults(): unknown[] {
    return [];
  }

  /**
   * Get the rule engine instance
   * @returns {IRuleEngine} Rule engine instance
   */
  public getRuleEngine(): IRuleEngine {
    return this.ruleEngine;
  }

  /**
   * Get the configuration manager instance
   * @returns {IConfigurationManager} Configuration manager instance
   */
  public getConfigManager(): IConfigurationManager {
    return this.configManager;
  }

  /**
   * Get the plugin manager instance
   * @returns {IPluginManager} Plugin manager instance
   */
  public getPluginManager(): IPluginManager {
    return this.pluginManager;
  }

  /**
   * Get the context store instance
   * @returns {IContextStore} Context store instance
   */
  public getContextStore(): IContextStore {
    return this.contextStore;
  }
}
