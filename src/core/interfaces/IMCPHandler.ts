import {
  CallToolRequest,
  ListToolsRequest,
  ListResourcesRequest,
  ReadResourceRequest,
  Tool,
  Resource,
  TextContent,
  ImageContent,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP request context
 */
export interface MCPRequestContext {
  requestId: string;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

/**
 * MCP response result
 */
export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
  executionTime: number;
}

/**
 * MCP tool execution result
 */
export interface ToolExecutionResult {
  success: boolean;
  content: (TextContent | ImageContent)[];
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * MCP resource read result
 */
export interface ResourceReadResult {
  success: boolean;
  content: (TextContent | ImageContent)[];
  mimeType?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for MCP protocol handling operations
 */
export interface IMCPHandler {
  /**
   * Handle tool listing requests
   */
  handleListTools(
    request: ListToolsRequest,
    context: MCPRequestContext
  ): Promise<MCPResponse<Tool[]>>;

  /**
   * Handle tool execution requests
   */
  handleCallTool(
    request: CallToolRequest,
    context: MCPRequestContext
  ): Promise<MCPResponse<ToolExecutionResult>>;

  /**
   * Handle resource listing requests
   */
  handleListResources(
    request: ListResourcesRequest,
    context: MCPRequestContext
  ): Promise<MCPResponse<Resource[]>>;

  /**
   * Handle resource reading requests
   */
  handleReadResource(
    request: ReadResourceRequest,
    context: MCPRequestContext
  ): Promise<MCPResponse<ResourceReadResult>>;

  /**
   * Register a new tool
   */
  registerTool(
    tool: Tool,
    handler: (
      request: CallToolRequest,
      context: MCPRequestContext
    ) => Promise<ToolExecutionResult>
  ): Promise<void>;

  /**
   * Unregister a tool
   */
  unregisterTool(toolName: string): Promise<boolean>;

  /**
   * Register a new resource
   */
  registerResource(
    resource: Resource,
    handler: (
      request: ReadResourceRequest,
      context: MCPRequestContext
    ) => Promise<ResourceReadResult>
  ): Promise<void>;

  /**
   * Unregister a resource
   */
  unregisterResource(resourceUri: string): Promise<boolean>;

  /**
   * Get all registered tools
   */
  getRegisteredTools(): Promise<Tool[]>;

  /**
   * Get all registered resources
   */
  getRegisteredResources(): Promise<Resource[]>;

  /**
   * Validate MCP request
   */
  validateRequest(request: any): Promise<boolean>;

  /**
   * Get handler statistics
   */
  getStats(): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    toolUsage: Record<string, number>;
    resourceUsage: Record<string, number>;
  }>;
}
