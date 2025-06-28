import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/**
 * Common interface for MCP transport adapters
 * Handles the transport layer connection, not server creation
 */
export interface ITransportAdapter {
  /**
   * Connect the MCP server to this transport
   * @param server - The MCP server instance to connect
   * @returns Promise resolving when connection is established
   */
  connect(server: McpServer): Promise<void>;

  /**
   * Disconnect the transport
   * @returns Promise resolving when disconnection is complete
   */
  disconnect(): Promise<void>;

  /**
   * Check if the transport is currently connected
   * @returns Boolean indicating connection status
   */
  isConnected(): boolean;

  /**
   * Get transport address information (if applicable)
   * @returns Address info or null if not applicable/available
   */
  getAddress?(): { host: string; port: number } | null;

  /**
   * Get transport type identifier
   * @returns String identifying the transport type
   */
  getType(): string;
}
