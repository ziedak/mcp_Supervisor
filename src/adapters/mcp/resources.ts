import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { IMcpWorkspaceSupervisor } from '../../core/interfaces/IMcpWorkspaceSupervisor';
import z from 'zod';
import type {
  IPluginManager,
  IRulePlugin,
} from '../../core/services/PluginManager';
import type {
  IContextStore,
  ContextEntry,
} from '../../core/interfaces/IContextStore';

/**
 * Register all MCP resources
 * @param server - MCP Server instance
 * @param workspaceSupervisor - Workspace Supervisor service
 */
export function registerMcpResources(
  server: McpServer,
  workspaceSupervisor: IMcpWorkspaceSupervisor
): void {
  const logger = workspaceSupervisor.getLogger();

  // Workspace Info Resource
  server.registerResource(
    'workspace-info',
    'workspace://info',
    {
      title: 'Workspace Information',
      description: 'Information about the current workspace',
      mimeType: 'application/json',
    },
    async (uri: URL) => {
      try {
        logger.debug('Retrieving workspace information');
        const info = workspaceSupervisor.getWorkspaceInfo();
        return {
          contents: [info],
        };
      } catch (error) {
        logger.error(
          'Failed to retrieve workspace information',
          error instanceof Error ? error : new Error(String(error))
        );
        throw new Error(`Failed to retrieve workspace information: ${error}`);
      }
    }
  );

  // Audit Log Resource
  server.registerResource(
    'audit-log',
    'workspace://audit-log',
    {
      title: 'Audit Log',
      description: 'History of user and system actions',
      mimeType: 'application/json',
    },
    async (uri: URL) => {
      try {
        logger.debug('Retrieving audit log');
        const auditLog = workspaceSupervisor.getAuditLogService();
        let entries = auditLog.getHistory();
        // Filtering support
        const limit = uri.searchParams?.get('limit');
        const since = uri.searchParams?.get('since');
        if (since) {
          const sinceDate = new Date(since);
          entries = entries.filter(
            (e: any) => e.timestamp >= sinceDate.getTime()
          );
        }
        if (limit) {
          const n = parseInt(limit, 10);
          if (!isNaN(n)) entries = entries.slice(-n);
        }
        return {
          contents: [entries],
        };
      } catch (error) {
        logger.error(
          'Failed to retrieve audit log',
          error instanceof Error ? error : new Error(String(error))
        );
        throw new Error(`Failed to retrieve audit log: ${error}`);
      }
    }
  );

  // Config Resource
  server.registerResource(
    'workspace-config',
    'workspace://config',
    {
      title: 'Workspace Configuration',
      description: 'Current workspace configuration',
      mimeType: 'application/json',
    },
    async (uri: URL) => {
      try {
        logger.debug('Retrieving workspace configuration');
        const config = workspaceSupervisor.getConfig();
        return {
          contents: [config],
        };
      } catch (error) {
        logger.error(
          'Failed to retrieve workspace configuration',
          error instanceof Error ? error : new Error(String(error))
        );
        throw new Error(`Failed to retrieve workspace configuration: ${error}`);
      }
    }
  );

  // Rule Results Resource
  server.registerResource(
    'rule-results',
    'workspace://rule-results',
    {
      title: 'Rule Execution Results',
      description: 'Most recent rule execution results',
      mimeType: 'application/json',
    },
    async (uri: URL) => {
      try {
        logger.debug('Retrieving rule execution results');
        let results = workspaceSupervisor.getRecentRuleResults();
        // Filtering support
        const limit = uri.searchParams?.get('limit');
        const since = uri.searchParams?.get('since');
        if (since) {
          const sinceDate = new Date(since);
          results = results.filter(
            (r: any) => r.timestamp >= sinceDate.getTime()
          );
        }
        if (limit) {
          const n = parseInt(limit, 10);
          if (!isNaN(n)) results = results.slice(-n);
        }
        return {
          contents: [results],
        };
      } catch (error) {
        logger.error(
          'Failed to retrieve rule execution results',
          error instanceof Error ? error : new Error(String(error))
        );
        throw new Error(`Failed to retrieve rule execution results: ${error}`);
      }
    }
  );

  // Plugin Info Resource
  server.registerResource(
    'plugin-info',
    'workspace://plugins',
    {
      title: 'Plugin Information',
      description: 'List of loaded plugins and their metadata',
      mimeType: 'application/json',
    },
    async (uri: URL) => {
      try {
        logger.debug('Retrieving plugin information');
        const pluginManager = workspaceSupervisor.getPluginManager?.() as
          | IPluginManager
          | undefined;
        const plugins: string[] = pluginManager
          ? pluginManager.listPlugins()
          : [];
        return {
          contents: [plugins],
        };
      } catch (error) {
        logger.error(
          'Failed to retrieve plugin information',
          error instanceof Error ? error : new Error(String(error))
        );
        throw new Error(`Failed to retrieve plugin information: ${error}`);
      }
    }
  );

  // User/Task Context Resource
  server.registerResource(
    'user-context',
    'workspace://context',
    {
      title: 'User/Task Context',
      description: 'Current or recent user/task context snapshots',
      mimeType: 'application/json',
    },
    async (uri: URL) => {
      try {
        logger.debug('Retrieving user/task context');
        const contextStore = workspaceSupervisor.getContextStore?.() as
          | IContextStore
          | undefined;
        const contextEntries: ContextEntry[] = contextStore
          ? await contextStore.query({})
          : [];
        return {
          contents: [contextEntries],
        };
      } catch (error) {
        logger.error(
          'Failed to retrieve user/task context',
          error instanceof Error ? error : new Error(String(error))
        );
        throw new Error(`Failed to retrieve user/task context: ${error}`);
      }
    }
  );
}
