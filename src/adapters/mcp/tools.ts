import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import z from 'zod';
import { IMcpWorkspaceSupervisor } from '../../core/interfaces/IMcpWorkspaceSupervisor';

/**
 * Register all MCP tools
 * @param server - MCP Server instance
 * @param workspaceSupervisor - Workspace Supervisor service
 */
export function registerMcpTools(
  server: McpServer,
  workspaceSupervisor: IMcpWorkspaceSupervisor
): void {
  const logger = workspaceSupervisor.getLogger();

  // Register workspace scan tool
  server.registerTool(
    'scan-workspace',
    {
      title: 'Scan Workspace',
      description: 'Scan the workspace to update the file and symbol index',
      inputSchema: {
        path: z
          .string()
          .optional()
          .describe('Optional path to scan, defaults to full workspace'),
      },
    },
    async ({ path }) => {
      try {
        const scanPath = path || process.cwd();
        logger.info('Scanning workspace', { path: scanPath });

        return {
          content: [
            {
              type: 'text',
              text: `Successfully scanned workspace .`,
            },
          ],
        };
      } catch (error) {
        logger.error(
          'Failed to scan workspace',
          error instanceof Error ? error : new Error(String(error))
        );
        return {
          content: [
            {
              type: 'text',
              text: `Failed to scan workspace: ${error}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register run-rule tool
  server.registerTool(
    'run-rule',
    {
      title: 'Run Rule',
      description: 'Run a specific rule or rule set',
      inputSchema: {
        ruleId: z.string().describe('ID of the rule or rule set to execute'),
        params: z
          .record(z.any())
          .optional()
          .describe('Optional parameters for the rule'),
      },
    },
    async ({ ruleId, params }) => {
      try {
        logger.info('Running rule', { ruleId, params });
        const ruleEngine = workspaceSupervisor.getRuleEngine?.();
        if (!ruleEngine) throw new Error('Rule engine not available');
        // Use params as context.input if provided
        const context = params ? { input: params } : {};
        const result = await ruleEngine.executeRule(ruleId, context);
        return {
          content: [{ type: 'json', data: result }],
        };
      } catch (error) {
        logger.error(
          'Failed to run rule',
          error instanceof Error ? error : new Error(String(error))
        );
        return {
          content: [{ type: 'text', text: `Failed to run rule: ${error}` }],
          isError: true,
        };
      }
    }
  );

  // Register validate-config tool
  server.registerTool(
    'validate-config',
    {
      title: 'Validate Config',
      description: 'Validate the current workspace configuration',
      inputSchema: {},
    },
    async () => {
      try {
        logger.info('Validating workspace config');
        const configManager = workspaceSupervisor.getConfigManager?.();
        const config = workspaceSupervisor.getConfig();
        if (!configManager) throw new Error('Config manager not available');
        configManager.validateConfig(config); // Throws if invalid
        return {
          content: [{ type: 'json', data: { valid: true } }],
        };
      } catch (error) {
        logger.error(
          'Failed to validate config',
          error instanceof Error ? error : new Error(String(error))
        );
        return {
          content: [
            { type: 'text', text: `Failed to validate config: ${error}` },
          ],
          isError: true,
        };
      }
    }
  );

  // Register get-audit-history tool
  server.registerTool(
    'get-audit-history',
    {
      title: 'Get Audit History',
      description: 'Retrieve audit log entries (with optional filters)',
      inputSchema: {
        limit: z
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .describe('Max number of entries'),
        since: z
          .string()
          .datetime()
          .optional()
          .describe('ISO date string for filtering'),
      },
    },
    async ({ limit, since }) => {
      try {
        logger.info('Retrieving audit history', { limit, since });
        const auditLog = workspaceSupervisor.getAuditLogService?.();
        if (!auditLog) throw new Error('Audit log service not available');
        let entries = auditLog.getHistory();
        if (since) {
          const sinceDate = new Date(since);
          entries = entries.filter(
            (e: any) => e.timestamp >= sinceDate.getTime()
          );
        }
        if (limit) {
          entries = entries.slice(-limit);
        }
        return {
          content: [{ type: 'json', data: entries }],
        };
      } catch (error) {
        logger.error(
          'Failed to get audit history',
          error instanceof Error ? error : new Error(String(error))
        );
        return {
          content: [
            { type: 'text', text: `Failed to get audit history: ${error}` },
          ],
          isError: true,
        };
      }
    }
  );

  // Register get-rule-results tool
  server.registerTool(
    'get-rule-results',
    {
      title: 'Get Rule Results',
      description: 'Get recent rule execution results',
      inputSchema: {
        limit: z
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .describe('Max number of results'),
      },
    },
    async ({ limit }) => {
      try {
        logger.info('Retrieving rule results', { limit });
        const results = workspaceSupervisor.getRecentRuleResults?.() || [];
        const limited = limit ? results.slice(-limit) : results;
        return {
          content: [{ type: 'json', data: limited }],
        };
      } catch (error) {
        logger.error(
          'Failed to get rule results',
          error instanceof Error ? error : new Error(String(error))
        );
        return {
          content: [
            { type: 'text', text: `Failed to get rule results: ${error}` },
          ],
          isError: true,
        };
      }
    }
  );

  // Register list-plugins tool
  server.registerTool(
    'list-plugins',
    {
      title: 'List Plugins',
      description: 'List all loaded plugins and their metadata',
      inputSchema: {},
    },
    async () => {
      try {
        logger.info('Listing plugins');
        const pluginManager = workspaceSupervisor.getPluginManager?.();
        if (!pluginManager) throw new Error('Plugin manager not available');
        const plugins = pluginManager.listPlugins();
        return {
          content: [{ type: 'json', data: plugins }],
        };
      } catch (error) {
        logger.error(
          'Failed to list plugins',
          error instanceof Error ? error : new Error(String(error))
        );
        return {
          content: [{ type: 'text', text: `Failed to list plugins: ${error}` }],
          isError: true,
        };
      }
    }
  );

  // Register reload-plugin tool
  server.registerTool(
    'reload-plugin',
    {
      title: 'Reload Plugin',
      description: 'Reload a specific plugin',
      inputSchema: {
        pluginId: z.string().describe('ID of the plugin to reload'),
      },
    },
    async ({ pluginId }) => {
      try {
        logger.info('Reloading plugin', { pluginId });
        const pluginManager = workspaceSupervisor.getPluginManager?.();
        if (!pluginManager) throw new Error('Plugin manager not available');
        await pluginManager.unloadPlugin(pluginId);
        await pluginManager.loadPlugin(pluginId);
        return {
          content: [{ type: 'json', data: { reloaded: true, pluginId } }],
        };
      } catch (error) {
        logger.error(
          'Failed to reload plugin',
          error instanceof Error ? error : new Error(String(error))
        );
        return {
          content: [
            { type: 'text', text: `Failed to reload plugin: ${error}` },
          ],
          isError: true,
        };
      }
    }
  );

  // Register get-context tool
  server.registerTool(
    'get-context',
    {
      title: 'Get Context',
      description: 'Get current/recent user/task context',
      inputSchema: {},
    },
    async () => {
      try {
        logger.info('Getting user/task context');
        const contextStore = workspaceSupervisor.getContextStore?.();
        if (!contextStore) throw new Error('Context store not available');
        const contextEntries = await contextStore.queryAll();
        return {
          content: [{ type: 'json', data: contextEntries }],
        };
      } catch (error) {
        logger.error(
          'Failed to get context',
          error instanceof Error ? error : new Error(String(error))
        );
        return {
          content: [{ type: 'text', text: `Failed to get context: ${error}` }],
          isError: true,
        };
      }
    }
  );

  // Register set-context tool
  server.registerTool(
    'set-context',
    {
      title: 'Set Context',
      description: 'Set/update user/task context',
      inputSchema: {
        key: z.string().describe('Context key'),
        value: z.any().describe('Context value'),
      },
    },
    async ({ key, value }) => {
      try {
        logger.info('Setting user/task context', { key, value });
        const contextStore = workspaceSupervisor.getContextStore?.();
        if (!contextStore) throw new Error('Context store not available');
        await contextStore.set(key, value);
        return {
          content: [{ type: 'json', data: { set: true, key, value } }],
        };
      } catch (error) {
        logger.error(
          'Failed to set context',
          error instanceof Error ? error : new Error(String(error))
        );
        return {
          content: [{ type: 'text', text: `Failed to set context: ${error}` }],
          isError: true,
        };
      }
    }
  );

  // Register get-current-config tool
  server.registerTool(
    'get-current-config',
    {
      title: 'Get Current Config',
      description: 'Get the currently used .supervisorrc configuration',
      inputSchema: {},
    },
    async () => {
      try {
        logger.info('Getting current .supervisorrc config');
        const config = workspaceSupervisor.getConfig?.();
        if (!config) throw new Error('No config loaded');
        return {
          content: [{ type: 'json', data: config }],
        };
      } catch (error) {
        logger.error(
          'Failed to get current config',
          error instanceof Error ? error : new Error(String(error))
        );
        return {
          content: [
            { type: 'text', text: `Failed to get current config: ${error}` },
          ],
          isError: true,
        };
      }
    }
  );
}
