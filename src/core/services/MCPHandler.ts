import { injectable } from 'inversify';
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

import {
  IMCPHandler,
  MCPRequestContext,
  MCPResponse,
  ToolExecutionResult,
  ResourceReadResult,
} from '../interfaces/IMCPHandler';

/**
 * Tool handler function type
 */
type ToolHandler = (
  request: CallToolRequest,
  context: MCPRequestContext
) => Promise<ToolExecutionResult>;

/**
 * Resource handler function type
 */
type ResourceHandler = (
  request: ReadResourceRequest,
  context: MCPRequestContext
) => Promise<ResourceReadResult>;

/**
 * Implementation of the MCP handler service
 */
@injectable()
export class MCPHandler implements IMCPHandler {
  private tools: Map<string, Tool> = new Map();
  private toolHandlers: Map<string, ToolHandler> = new Map();
  private resources: Map<string, Resource> = new Map();
  private resourceHandlers: Map<string, ResourceHandler> = new Map();

  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    toolUsage: new Map<string, number>(),
    resourceUsage: new Map<string, number>(),
  };

  /**
   * Handle tool listing requests
   */
  async handleListTools(
    request: ListToolsRequest,
    context: MCPRequestContext
  ): Promise<MCPResponse<Tool[]>> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const tools = Array.from(this.tools.values());

      this.stats.successfulRequests++;
      return {
        success: true,
        data: tools,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.stats.failedRequests++;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    } finally {
      this.stats.totalResponseTime += Date.now() - startTime;
    }
  }

  /**
   * Handle tool execution requests
   */
  async handleCallTool(
    request: CallToolRequest,
    context: MCPRequestContext
  ): Promise<MCPResponse<ToolExecutionResult>> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const tool = this.tools.get(request.params.name);
      if (!tool) {
        this.stats.failedRequests++;
        return {
          success: false,
          error: `Tool '${request.params.name}' not found`,
          executionTime: Date.now() - startTime,
        };
      }

      const handler = this.toolHandlers.get(request.params.name);
      if (!handler) {
        this.stats.failedRequests++;
        return {
          success: false,
          error: `Handler for tool '${request.params.name}' not found`,
          executionTime: Date.now() - startTime,
        };
      }

      // Update tool usage statistics
      const currentUsage = this.stats.toolUsage.get(request.params.name) || 0;
      this.stats.toolUsage.set(request.params.name, currentUsage + 1);

      const result = await handler(request, context);

      this.stats.successfulRequests++;
      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.stats.failedRequests++;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    } finally {
      this.stats.totalResponseTime += Date.now() - startTime;
    }
  }

  /**
   * Handle resource listing requests
   */
  async handleListResources(
    request: ListResourcesRequest,
    context: MCPRequestContext
  ): Promise<MCPResponse<Resource[]>> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const resources = Array.from(this.resources.values());

      this.stats.successfulRequests++;
      return {
        success: true,
        data: resources,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.stats.failedRequests++;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    } finally {
      this.stats.totalResponseTime += Date.now() - startTime;
    }
  }

  /**
   * Handle resource reading requests
   */
  async handleReadResource(
    request: ReadResourceRequest,
    context: MCPRequestContext
  ): Promise<MCPResponse<ResourceReadResult>> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const resource = this.resources.get(request.params.uri);
      if (!resource) {
        this.stats.failedRequests++;
        return {
          success: false,
          error: `Resource '${request.params.uri}' not found`,
          executionTime: Date.now() - startTime,
        };
      }

      const handler = this.resourceHandlers.get(request.params.uri);
      if (!handler) {
        this.stats.failedRequests++;
        return {
          success: false,
          error: `Handler for resource '${request.params.uri}' not found`,
          executionTime: Date.now() - startTime,
        };
      }

      // Update resource usage statistics
      const currentUsage =
        this.stats.resourceUsage.get(request.params.uri) || 0;
      this.stats.resourceUsage.set(request.params.uri, currentUsage + 1);

      const result = await handler(request, context);

      this.stats.successfulRequests++;
      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.stats.failedRequests++;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    } finally {
      this.stats.totalResponseTime += Date.now() - startTime;
    }
  }

  /**
   * Register a new tool
   */
  async registerTool(tool: Tool, handler: ToolHandler): Promise<void> {
    this.tools.set(tool.name, tool);
    this.toolHandlers.set(tool.name, handler);
    this.stats.toolUsage.set(tool.name, 0);
  }

  /**
   * Unregister a tool
   */
  async unregisterTool(toolName: string): Promise<boolean> {
    const toolExists = this.tools.has(toolName);
    if (toolExists) {
      this.tools.delete(toolName);
      this.toolHandlers.delete(toolName);
      this.stats.toolUsage.delete(toolName);
    }
    return toolExists;
  }

  /**
   * Register a new resource
   */
  async registerResource(
    resource: Resource,
    handler: ResourceHandler
  ): Promise<void> {
    this.resources.set(resource.uri, resource);
    this.resourceHandlers.set(resource.uri, handler);
    this.stats.resourceUsage.set(resource.uri, 0);
  }

  /**
   * Unregister a resource
   */
  async unregisterResource(resourceUri: string): Promise<boolean> {
    const resourceExists = this.resources.has(resourceUri);
    if (resourceExists) {
      this.resources.delete(resourceUri);
      this.resourceHandlers.delete(resourceUri);
      this.stats.resourceUsage.delete(resourceUri);
    }
    return resourceExists;
  }

  /**
   * Get all registered tools
   */
  async getRegisteredTools(): Promise<Tool[]> {
    return Array.from(this.tools.values());
  }

  /**
   * Get all registered resources
   */
  async getRegisteredResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  /**
   * Validate MCP request
   */
  async validateRequest(request: any): Promise<boolean> {
    // Basic request validation
    if (!request || typeof request !== 'object') {
      return false;
    }

    // Check for required fields based on request type
    if (request.method === 'tools/call') {
      return !!request.params?.name;
    }

    if (request.method === 'resources/read') {
      return !!request.params?.uri;
    }

    // For list methods, no specific params are required
    return true;
  }

  /**
   * Get handler statistics
   */
  async getStats(): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    toolUsage: Record<string, number>;
    resourceUsage: Record<string, number>;
  }> {
    const averageResponseTime =
      this.stats.totalRequests > 0
        ? this.stats.totalResponseTime / this.stats.totalRequests
        : 0;

    return {
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      averageResponseTime,
      toolUsage: Object.fromEntries(this.stats.toolUsage),
      resourceUsage: Object.fromEntries(this.stats.resourceUsage),
    };
  }

  /**
   * Create a standard text response
   */
  protected createTextResponse(content: string): TextContent {
    return {
      type: 'text',
      text: content,
    };
  }

  /**
   * Create a standard error response
   */
  protected createErrorResponse(message: string): ToolExecutionResult {
    return {
      success: false,
      content: [this.createTextResponse(`Error: ${message}`)],
      error: message,
    };
  }

  /**
   * Create a standard success response
   */
  protected createSuccessResponse(
    content: string,
    metadata?: Record<string, any>
  ): ToolExecutionResult {
    return {
      success: true,
      content: [this.createTextResponse(content)],
      metadata,
    };
  }
}
