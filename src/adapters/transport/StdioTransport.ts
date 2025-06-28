import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ITransportAdapter } from '../../core/interfaces/ITransportAdapter';

/**
 * Stdio transport adapter for MCP server
 * Handles standard input/output communication
 */
export class StdioTransport implements ITransportAdapter {
  private transport: StdioServerTransport | null = null;
  private connected = false;

  /**
   * Connect the MCP server via stdio transport
   */
  async connect(server: McpServer): Promise<void> {
    if (this.connected) {
      throw new Error('Stdio transport is already connected');
    }

    this.transport = new StdioServerTransport();
    await server.connect(this.transport);
    this.connected = true;
  }

  /**
   * Disconnect the stdio transport
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    // StdioServerTransport doesn't have explicit disconnect method
    // Connection is managed by the underlying stdio streams
    this.transport = null;
    this.connected = false;
  }

  /**
   * Check if transport is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get transport type
   */
  getType(): string {
    return 'stdio';
  }

  /**
   * Get address - not applicable for stdio
   */
  getAddress(): null {
    return null;
  }
}
