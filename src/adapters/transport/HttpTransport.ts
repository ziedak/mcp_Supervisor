import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { ITransportAdapter } from '../../core/interfaces/ITransportAdapter';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { Server } from 'http';

export interface HttpTransportConfig {
  port: number;
  host?: string;
  cors?: {
    origin: string[];
    methods: string[];
    allowedHeaders: string[];
  };
  timeout?: number;
  maxRequestSize?: string;
}

/**
 * HTTP transport adapter for MCP server using Streamable HTTP
 * Implements the MCP Streamable HTTP transport protocol
 */
export class HttpTransport implements ITransportAdapter {
  private transport: StreamableHTTPServerTransport | null = null;
  private connected = false;
  private config: HttpTransportConfig;
  private app: express.Application | null = null;
  private httpServer: Server | null = null;
  private transports: { [sessionId: string]: StreamableHTTPServerTransport } =
    {};

  constructor(config: HttpTransportConfig) {
    this.config = config;
  }

  /**
   * Connect the MCP server via HTTP transport using Express and StreamableHTTPServerTransport
   */
  async connect(server: McpServer): Promise<void> {
    if (this.connected) {
      throw new Error('HTTP transport is already connected');
    }

    // Create Express app
    this.app = express();
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Handle CORS if configured
    if (this.config.cors) {
      this.app.use((req, res, next) => {
        if (this.config.cors) {
          res.header(
            'Access-Control-Allow-Origin',
            this.config.cors.origin.join(', ')
          );
          res.header(
            'Access-Control-Allow-Methods',
            this.config.cors.methods.join(', ')
          );
          res.header(
            'Access-Control-Allow-Headers',
            this.config.cors.allowedHeaders.join(', ')
          );
        }
        next();
      });
    }

    // Handle POST requests for client-to-server communication
    this.app.post('/mcp', async (req, res) => {
      try {
        // Check for existing session ID
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        if (sessionId && this.transports[sessionId]) {
          // Reuse existing transport
          transport = this.transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
          // New initialization request
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: sessionId => {
              // Store the transport by session ID
              this.transports[sessionId] = transport;
            },
          });

          // Clean up transport when closed
          transport.onclose = () => {
            if (transport.sessionId) {
              delete this.transports[transport.sessionId];
            }
          };

          // Connect to the MCP server
          await server.connect(transport);
        } else {
          // Invalid request
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided',
            },
            id: null,
          });
          return;
        }

        // Handle the request
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    // Reusable handler for GET and DELETE requests
    const handleSessionRequest = async (
      req: express.Request,
      res: express.Response
    ) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (!sessionId || !this.transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }

      const transport = this.transports[sessionId];
      await transport.handleRequest(req, res);
    };

    // Handle GET requests for server-to-client notifications via SSE
    this.app.get('/mcp', handleSessionRequest);

    // Handle DELETE requests for session termination
    this.app.delete('/mcp', handleSessionRequest);

    // Start the HTTP server
    this.httpServer = this.app.listen(
      this.config.port,
      this.config.host || 'localhost',
      () => {
        this.connected = true;
        console.info(
          `server up on ${this.config.host || 'localhost'}:${this.config.port}`
        );
      }
    );

    // Store the first transport for backwards compatibility with getType and getAddress
    // In a real implementation with multiple sessions, you might want to handle this differently
    this.transport = Object.values(this.transports)[0] || null;
  }

  /**
   * Disconnect the HTTP transport
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    // Close all active transports
    for (const transport of Object.values(this.transports)) {
      try {
        await transport.close();
      } catch (error) {
        console.error('Error closing transport:', error);
      }
    }

    // Close the HTTP server
    if (this.httpServer) {
      await new Promise<void>((resolve, reject) => {
        const server = this.httpServer!;
        server.close(err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });

        // Force close after a timeout to prevent hanging
        setTimeout(() => {
          if (server.listening) {
            server.closeAllConnections?.();
          }
          resolve();
        }, 1000);
      });
    }

    this.transports = {};
    this.transport = null;
    this.app = null;
    this.httpServer = null;
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
    return 'http';
  }

  /**
   * Get the configured server address
   */
  getAddress(): { host: string; port: number } | null {
    if (!this.connected) {
      return null;
    }

    return {
      host: this.config.host || 'localhost',
      port: this.config.port,
    };
  }
}
