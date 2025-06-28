import 'reflect-metadata';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { container } from './config/container'; // Import the already configured container
import { TYPES } from './config/types';
import { IMcpWorkspaceSupervisor } from './core/interfaces/IMcpWorkspaceSupervisor';
import { registerMcpResources } from './adapters/mcp/resources';
import { registerMcpTools } from './adapters/mcp/tools';
import {
  TransportFactory,
  TransportType,
  TransportOptions,
} from './adapters/transport/TransportFactory';
import { ITransportAdapter } from './core/interfaces/ITransportAdapter';

/**
 * Start the MCP server with the provided workspace Supervisor instance and transport
 * @param workspaceSupervisor - Initialized workspace Supervisor instance
 * @param transportType - Type of transport to use ('stdio' | 'http')
 * @param transportOptions - Configuration options for the transport
 */
export async function startMcpServer(
  workspaceSupervisor: IMcpWorkspaceSupervisor,
  transportType: TransportType = 'stdio',
  transportOptions?: TransportOptions
): Promise<{ server: McpServer; transport: ITransportAdapter }> {
  const logger = workspaceSupervisor.getLogger();
  const config = workspaceSupervisor.getConfig();

  logger.info('Starting MCP Server', {
    name: config.name,
    version: config.version,
    transport: transportType,
  });

  // Create MCP server
  const server = new McpServer({
    name: config.name,
    version: config.version,
  });

  // Register MCP resources and tools
  registerMcpResources(server, workspaceSupervisor);
  registerMcpTools(server, workspaceSupervisor);

  // Create and connect transport
  const transport = TransportFactory.create(transportType, transportOptions);
  await transport.connect(server);

  logger.info('MCP Server started and connected', {
    transport: transport.getType(),
    address: transport.getAddress?.() || null,
  });

  return { server, transport };
}

/**
 * Main entry point for direct execution (stdio transport)
 */
async function main(): Promise<void> {
  try {
    // Get application services from the already configured container
    // imported at the top of the file (no need to call configureContainer again)
    const workspaceSupervisor = container.get<IMcpWorkspaceSupervisor>(
      TYPES.McpWorkspaceSupervisor
    );
    const logger = workspaceSupervisor.getLogger();

    // Initialize workspace with current directory
    await workspaceSupervisor.initialize(process.cwd());

    // Start MCP server with stdio transport (default)
    await startMcpServer(workspaceSupervisor, 'stdio');
  } catch (error) {
    console.error('Failed to initialize MCP server:', error);
    process.exit(1);
  }
}

// Execute main function when file is run directly

if (require.main === module) {
  main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}
