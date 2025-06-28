#!/usr/bin/env node

import 'reflect-metadata';

import path from 'path';
import * as fs from 'fs';
import { container } from './config/container';
import { TYPES } from './config/types';
import { IMcpWorkspaceSupervisor } from './core/interfaces/IMcpWorkspaceSupervisor';
import { ILogger } from './core/interfaces/ILogger';
import { startMcpServer } from './index';
import {
  TransportType,
  TransportOptions,
} from './adapters/transport/TransportFactory';

export interface CliOptions {
  workspacePath: string;
  transport: TransportType;
  port: number;
  host: string;
}

/**
 * Show help message
 */
export function showHelp(): void {
  console.log(`
MCP Workspace Supervisor Server

Usage: npm run start:server [workspace_path] [options]

Arguments:
  workspace_path          Path to the workspace to analyze (default: current directory)

Options:
  --transport <type>      Transport type: stdio or http (default: stdio)
  --port <number>         Port for HTTP transport (default: 3000)
  --host <host>           Host for HTTP transport (default: localhost)
  --help, -h              Show this help message

Examples:
  npm run start:server                                    # Start with stdio transport
  npm run start:server /path/to/workspace                 # Specify workspace path
  npm run start:server --transport http --port 3000       # Start with HTTP transport
  npm run start:server /path/to/workspace --transport http # Workspace + HTTP transport
	`);
}

/**
 * Validate transport type
 */
export function validateTransport(
  transport: string
): transport is TransportType {
  return transport === 'stdio' || transport === 'http';
}

/**
 * Validate port number
 */
export function validatePort(portStr: string): number {
  const port = parseInt(portStr, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid port '${portStr}'. Must be a number between 1 and 65535.`
    );
  }
  return port;
}

/**
 * Parse command line arguments
 */
export function parseArguments(
  args: string[] = process.argv.slice(2)
): CliOptions {
  const options: CliOptions = {
    workspacePath: process.cwd(),
    transport: 'stdio' as TransportType,
    port: 3000,
    host: 'localhost',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg === '--transport') {
      const transport = args[++i];
      if (!transport) {
        throw new Error('Error: --transport requires a value');
      }
      if (!validateTransport(transport)) {
        throw new Error(
          `Error: Invalid transport type '${transport}'. Must be 'stdio' or 'http'.`
        );
      }
      options.transport = transport;
    } else if (arg === '--port') {
      const portStr = args[++i];
      if (!portStr) {
        throw new Error('Error: --port requires a value');
      }
      options.port = validatePort(portStr);
    } else if (arg === '--host') {
      const host = args[++i];
      if (!host) {
        throw new Error('Error: --host requires a value');
      }
      options.host = host;
    } else if (arg && !arg.startsWith('--')) {
      // First non-option argument is workspace path
      options.workspacePath = arg;
    } else if (arg) {
      throw new Error(
        `Error: Unknown option '${arg}'. Use --help for usage information.`
      );
    }
  }

  return options;
}

/**
 * Entry point for the MCP workspace Supervisor server
 */
export async function main(): Promise<void> {
  const options = parseArguments();
  const absoluteWorkspacePath = path.resolve(options.workspacePath);

  // Validate workspace path exists and is a directory
  try {
    const stats = await fs.promises.stat(absoluteWorkspacePath);
    if (!stats.isDirectory()) {
      throw new Error('Workspace path is not a directory');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('ENOENT')) {
      throw new Error(
        `Workspace path does not exist: ${absoluteWorkspacePath}`
      );
    }
    throw error;
  }

  // Get services from DI container
  const logger = container.get<ILogger>(TYPES.Logger);
  const workspaceSupervisor = container.get<IMcpWorkspaceSupervisor>(
    TYPES.McpWorkspaceSupervisor
  );

  // Log startup information
  logger.info(`MCP Workspace Supervisor starting...`);
  logger.info(`Workspace path: ${absoluteWorkspacePath}`);
  logger.info(`Transport: ${options.transport}`);

  if (options.transport === 'http') {
    logger.info(
      `HTTP server will be available at: http://${options.host}:${options.port}`
    );
  }

  // Initialize the workspace Supervisor
  await workspaceSupervisor.initialize(absoluteWorkspacePath);

  // Prepare transport options
  const transportOptions: TransportOptions | undefined =
    options.transport === 'http'
      ? {
          http: {
            port: options.port,
            host: options.host,
          },
        }
      : undefined;

  // Initialize and start the MCP server with selected transport
  const { server, transport } = await startMcpServer(
    workspaceSupervisor,
    options.transport,
    transportOptions
  );

  logger.info(`MCP Workspace Supervisor server started successfully`);
  logger.info(`Server running with ${transport.getType()} transport`);

  if (transport.getAddress?.()) {
    logger.info(`Server address: ${JSON.stringify(transport.getAddress())}`);
  }

  // Handle graceful shutdown
  setupGracefulShutdown(logger, transport);
}

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown(logger: ILogger, transport: any): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    try {
      await transport.disconnect();
      logger.info('Server stopped successfully');
      process.exit(0);
    } catch (error) {
      logger.error(
        'Error during shutdown',
        error instanceof Error ? error : new Error(String(error))
      );
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Run the main function only if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:');
    console.error(error);
    process.exit(1);
  });
}
