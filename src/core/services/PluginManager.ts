/**
 * Plugin Manager for the Rule Engine
 * Handles dynamic loading and management of rule plugins
 * Following SOLID principles with single responsibility for plugin management
 */

import { resolve, extname } from 'path';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import {
  PluginError,
  PluginLoadError,
  PluginNotFoundError,
} from '../errors/RuleEngineErrors';
import { injectable, inject } from 'inversify';
import type { ILogger } from '../interfaces/ILogger';
import { TYPES } from '../../config/types';
import type {
  PluginConfigType,
  RuleResultType,
} from '../schemas/RuleEngineSchemas';

/**
 * Plugin interface that all rule plugins must implement
 */
export interface IRulePlugin {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  execute(input: unknown, config: PluginConfigType): Promise<RuleResultType>;
  validate?(config: PluginConfigType): boolean;
  init?(): Promise<void>;
  cleanup?(): Promise<void>;
}

/**
 * Plugin registry interface
 */
export interface IPluginRegistry {
  register(plugin: IRulePlugin): void;
  unregister(name: string): void;
  get(name: string): IRulePlugin | undefined;
  has(name: string): boolean;
  list(): string[];
  clear(): void;
}

/**
 * Plugin manager interface
 */
export interface IPluginManager {
  loadPlugin(pluginPath: string): Promise<IRulePlugin>;
  loadPluginsFromDirectory(directory: string): Promise<IRulePlugin[]>;
  unloadPlugin(name: string): Promise<void>;
  getPlugin(name: string): IRulePlugin;
  hasPlugin(name: string): boolean;
  listPlugins(): string[];
  executePlugin(
    name: string,
    input: unknown,
    config: PluginConfigType
  ): Promise<RuleResultType>;
  validatePluginConfig(name: string, config: PluginConfigType): boolean;
  initializePlugins(): Promise<void>;
  cleanupPlugins(): Promise<void>;
}

/**
 * Plugin registry implementation
 */
@injectable()
export class PluginRegistry implements IPluginRegistry {
  private plugins = new Map<string, IRulePlugin>();

  register(plugin: IRulePlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new PluginError(`Plugin '${plugin.name}' is already registered`, {
        pluginName: plugin.name,
      });
    }
    this.plugins.set(plugin.name, plugin);
  }

  unregister(name: string): void {
    if (!this.plugins.has(name)) {
      throw new PluginNotFoundError(name);
    }
    this.plugins.delete(name);
  }

  get(name: string): IRulePlugin | undefined {
    return this.plugins.get(name);
  }

  has(name: string): boolean {
    return this.plugins.has(name);
  }

  list(): string[] {
    return Array.from(this.plugins.keys());
  }

  clear(): void {
    this.plugins.clear();
  }
}

/**
 * Plugin manager implementation
 */
@injectable()
export class PluginManager implements IPluginManager {
  

  private readonly supportedExtensions = ['.js', '.ts', '.mjs'];

  constructor(
    @inject(TYPES.PluginRegistry) private readonly registry: IPluginRegistry,
    @inject(TYPES.Logger) private readonly logger: ILogger
  ) {}

  /**
   * Load a single plugin from a file path
   */
  async loadPlugin(pluginPath: string): Promise<IRulePlugin> {
    try {
      const resolvedPath = resolve(pluginPath);

      if (!existsSync(resolvedPath)) {
        throw new PluginLoadError(`Plugin file not found: ${resolvedPath}`, {
          pluginPath: resolvedPath,
        });
      }

      const extension = extname(resolvedPath);
      if (!this.supportedExtensions.includes(extension)) {
        throw new PluginLoadError(
          `Unsupported plugin file extension: ${extension}. Supported: ${this.supportedExtensions.join(', ')}`,
          { pluginPath: resolvedPath, extension }
        );
      }

      this.logger.info(`Loading plugin from: ${resolvedPath}`);

      // Dynamic import for ES modules and CommonJS
      const pluginModule = await import(resolvedPath);

      // Handle different export patterns
      const plugin = this.extractPlugin(pluginModule, resolvedPath);

      // Validate plugin interface
      this.validatePluginInterface(plugin, resolvedPath);

      // Initialize plugin if it has an init method
      if (plugin.init) {
        await plugin.init();
      }

      // Register the plugin
      this.registry.register(plugin);

      this.logger.info(`Plugin '${plugin.name}' loaded successfully`);
      return plugin;
    } catch (error: unknown) {
      if (error instanceof PluginError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new PluginLoadError(
        `Failed to load plugin from ${pluginPath}: ${errorMessage}`,
        { pluginPath, originalError: error }
      );
    }
  }

  /**
   * Load all plugins from a directory
   */
  async loadPluginsFromDirectory(directory: string): Promise<IRulePlugin[]> {
    try {
      const resolvedDir = resolve(directory);

      if (!existsSync(resolvedDir)) {
        this.logger.warn(`Plugin directory not found: ${resolvedDir}`);
        return [];
      }

      const dirStat = await stat(resolvedDir);
      if (!dirStat.isDirectory()) {
        throw new PluginLoadError(`Path is not a directory: ${resolvedDir}`, {
          pluginPath: resolvedDir,
        });
      }

      this.logger.info(`Loading plugins from directory: ${resolvedDir}`);

      const files = await readdir(resolvedDir);
      const pluginFiles = files.filter(file =>
        this.supportedExtensions.includes(extname(file))
      );

      const loadedPlugins: IRulePlugin[] = [];
      const loadErrors: Array<{ file: string; error: Error }> = [];

      for (const file of pluginFiles) {
        try {
          const pluginPath = resolve(resolvedDir, file);
          const plugin = await this.loadPlugin(pluginPath);
          loadedPlugins.push(plugin);
        } catch (error) {
          const errorObj =
            error instanceof Error ? error : new Error(String(error));
          loadErrors.push({ file, error: errorObj });
          this.logger.error(
            `Failed to load plugin ${file}: ${errorObj.message}`
          );
        }
      }

      if (loadErrors.length > 0 && loadedPlugins.length === 0) {
        throw new PluginLoadError(
          `Failed to load any plugins from directory: ${resolvedDir}`,
          { pluginPath: resolvedDir, loadErrors }
        );
      }

      this.logger.info(
        `Loaded ${loadedPlugins.length} plugins from ${resolvedDir}`
      );
      return loadedPlugins;
    } catch (error: unknown) {
      if (error instanceof PluginError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new PluginLoadError(
        `Failed to load plugins from directory ${directory}: ${errorMessage}`,
        { pluginPath: directory, originalError: error }
      );
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.registry.get(name);
    if (!plugin) {
      throw new PluginNotFoundError(name);
    }

    try {
      // Cleanup plugin if it has a cleanup method
      if (plugin.cleanup) {
        await plugin.cleanup();
      }

      this.registry.unregister(name);
      this.logger.info(`Plugin '${name}' unloaded successfully`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new PluginError(
        `Failed to unload plugin '${name}': ${errorMessage}`,
        { pluginName: name, originalError: error }
      );
    }
  }

  /**
   * Get a plugin by name
   */
  getPlugin(name: string): IRulePlugin {
    const plugin = this.registry.get(name);
    if (!plugin) {
      throw new PluginNotFoundError(name);
    }
    return plugin;
  }

  /**
   * Check if a plugin exists
   */
  hasPlugin(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * List all loaded plugins
   */
  listPlugins(): string[] {
    return this.registry.list();
  }

  /**
   * Execute a plugin with given input and config
   */
  async executePlugin(
    name: string,
    input: unknown,
    config: PluginConfigType
  ): Promise<RuleResultType> {
    const plugin = this.getPlugin(name);

    try {
      // Validate config if plugin supports it
      if (plugin.validate && !plugin.validate(config)) {
        throw new PluginError(`Invalid configuration for plugin '${name}'`, {
          pluginName: name,
          config,
        });
      }

      return await plugin.execute(input, config);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new PluginError(
        `Plugin '${name}' execution failed: ${errorMessage}`,
        { pluginName: name, originalError: error }
      );
    }
  }

  /**
   * Validate plugin configuration
   */
  validatePluginConfig(name: string, config: PluginConfigType): boolean {
    const plugin = this.getPlugin(name);

    if (!plugin.validate) {
      // If plugin doesn't provide validation, assume config is valid
      return true;
    }

    return plugin.validate(config);
  }

  /**
   * Initialize all loaded plugins
   */
  async initializePlugins(): Promise<void> {
    const pluginNames = this.listPlugins();
    const initErrors: Array<{ name: string; error: Error }> = [];

    for (const name of pluginNames) {
      try {
        const plugin = this.getPlugin(name);
        if (plugin.init) {
          await plugin.init();
        }
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        initErrors.push({ name, error: errorObj });
        this.logger.error(
          `Failed to initialize plugin ${name}: ${errorObj.message}`
        );
      }
    }

    if (initErrors.length > 0) {
      throw new PluginError(
        `Failed to initialize ${initErrors.length} plugins`,
        { initErrors }
      );
    }
  }

  /**
   * Cleanup all loaded plugins
   */
  async cleanupPlugins(): Promise<void> {
    const pluginNames = this.listPlugins();
    const cleanupErrors: Array<{ name: string; error: Error }> = [];

    for (const name of pluginNames) {
      try {
        const plugin = this.getPlugin(name);
        if (plugin.cleanup) {
          await plugin.cleanup();
        }
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        cleanupErrors.push({ name, error: errorObj });
        this.logger.error(
          `Failed to cleanup plugin ${name}: ${errorObj.message}`
        );
      }
    }

    // Clear registry after cleanup
    this.registry.clear();

    if (cleanupErrors.length > 0) {
      this.logger.warn(
        `Cleanup errors occurred for ${cleanupErrors.length} plugins`
      );
    }
  }

  /**
   * Extract plugin from module exports
   */
  private extractPlugin(pluginModule: any, pluginPath: string): IRulePlugin {
    // Try different export patterns
    let plugin: IRulePlugin | undefined;

    if (pluginModule.default && typeof pluginModule.default === 'object') {
      plugin = pluginModule.default;
    } else if (pluginModule.plugin && typeof pluginModule.plugin === 'object') {
      plugin = pluginModule.plugin;
    } else if (
      typeof pluginModule === 'object' &&
      pluginModule.name &&
      pluginModule.execute
    ) {
      plugin = pluginModule;
    }

    if (!plugin) {
      throw new PluginLoadError(
        `Plugin does not export a valid plugin object. Expected 'default', 'plugin', or direct export with 'name' and 'execute' properties`,
        { pluginPath }
      );
    }

    return plugin;
  }

  /**
   * Validate that the plugin implements the required interface
   */
  private validatePluginInterface(
    plugin: any,
    pluginPath: string
  ): asserts plugin is IRulePlugin {
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new PluginLoadError(
        `Plugin must have a 'name' property of type string`,
        { pluginPath }
      );
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new PluginLoadError(
        `Plugin must have a 'version' property of type string`,
        { pluginPath }
      );
    }

    if (!plugin.execute || typeof plugin.execute !== 'function') {
      throw new PluginLoadError(`Plugin must have an 'execute' method`, {
        pluginPath,
      });
    }

    if (plugin.validate && typeof plugin.validate !== 'function') {
      throw new PluginLoadError(
        `Plugin 'validate' property must be a function if provided`,
        { pluginPath }
      );
    }

    if (plugin.init && typeof plugin.init !== 'function') {
      throw new PluginLoadError(
        `Plugin 'init' property must be a function if provided`,
        { pluginPath }
      );
    }

    if (plugin.cleanup && typeof plugin.cleanup !== 'function') {
      throw new PluginLoadError(
        `Plugin 'cleanup' property must be a function if provided`,
        { pluginPath }
      );
    }
  }
}
