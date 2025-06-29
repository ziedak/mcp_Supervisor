/**
 * Configuration Manager for the Rule Engine
 * Handles loading, validating, and managing supervisor configuration
 * Following SOLID principles with single responsibility for configuration management
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import z from 'zod';
import {
  SupervisorConfigSchema,
  type SupervisorConfigType,
} from '../schemas/RuleEngineSchemas';
import {
  ConfigurationError,
  ConfigurationNotLoadedError,
} from '../errors/RuleEngineErrors';
import type { ILogger } from '../interfaces/ILogger';
import { defaultConfig } from '../../config/defaultConfig';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../config/types';

export interface IConfigurationManager {
  loadConfig(configPath?: string): Promise<SupervisorConfigType>;
  getConfig(): SupervisorConfigType;
  isConfigLoaded(): boolean;
  validateConfig(config: unknown): SupervisorConfigType;
  getDefaultConfigPath(): string;
  createDefaultConfig(path?: string): Promise<string>;
}

/**
 * Configuration Manager implementation
 */
@injectable()
export class ConfigurationManager implements IConfigurationManager {
  private config: SupervisorConfigType | null = null;

  private readonly defaultConfigPaths = [
    '.supervisorrc.json',
    'supervisor.config.json',
    '.config/supervisor.json',
  ];

  constructor(@inject(TYPES.Logger) private readonly logger: ILogger) {}

  /**
   * Load configuration from file
   */
  async loadConfig(configPath?: string): Promise<SupervisorConfigType> {
    try {
      let resolvedPath: string | null = configPath || this.findConfigFile();

      // If no config file exists, create a default one
      if (!resolvedPath) {
        this.logger.info(
          'No configuration file found, creating default configuration'
        );
        resolvedPath = await this.createDefaultConfig();
      }

      if (!existsSync(resolvedPath)) {
        throw new ConfigurationError(
          `Configuration file not found: ${resolvedPath}`
        );
      }

      this.logger.info(`Loading configuration from: ${resolvedPath}`);

      const configContent = readFileSync(resolvedPath, 'utf-8');
      let parsedConfig: unknown;

      try {
        parsedConfig = JSON.parse(configContent);
      } catch (parseError: unknown) {
        const errorMessage =
          parseError instanceof Error
            ? parseError.message
            : 'Unknown parsing error';
        throw new ConfigurationError(
          `Invalid JSON in configuration file: ${resolvedPath}`,
          { parseError: errorMessage }
        );
      }

      this.config = this.validateConfig(parsedConfig);
      this.logger.info('Configuration loaded and validated successfully');

      return this.config;
    } catch (error: unknown) {
      if (error instanceof ConfigurationError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new ConfigurationError(
        `Failed to load configuration: ${errorMessage}`,
        { originalError: error }
      );
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): SupervisorConfigType {
    if (!this.config) {
      throw new ConfigurationNotLoadedError();
    }
    return this.config;
  }

  /**
   * Check if configuration is loaded
   */
  isConfigLoaded(): boolean {
    return this.config !== null;
  }

  /**
   * Validate configuration using Zod schema
   */
  validateConfig(config: unknown): SupervisorConfigType {
    try {
      return SupervisorConfigSchema.parse(config);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError;
        const formattedErrors = zodError.errors
          .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
          .join('; ');

        throw new ConfigurationError(
          `Configuration validation failed: ${formattedErrors}`,
          { zodError: zodError.errors }
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new ConfigurationError(
        `Configuration validation failed: ${errorMessage}`,
        { originalError: error }
      );
    }
  }

  /**
   * Get default configuration file path
   */
  getDefaultConfigPath(): string {
    const foundPath = this.findConfigFile();
    if (foundPath !== null) {
      return foundPath;
    }
    // Fallback to first default path or hardcoded fallback
    return this.defaultConfigPaths[0] || '.supervisorrc.json';
  }

  /**
   * Create a default configuration file
   */
  async createDefaultConfig(path?: string): Promise<string> {
    const configPath =
      path ||
      join(process.cwd(), this.defaultConfigPaths[0] || '.supervisorrc.json');

    try {
      const configJson = JSON.stringify(defaultConfig, null, 2);
      writeFileSync(configPath, configJson, 'utf-8');

      this.logger.info(`Default configuration created at: ${configPath}`);
      return configPath;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new ConfigurationError(
        `Failed to create default configuration file: ${errorMessage}`,
        { originalError: error }
      );
    }
  }

  /**
   * Flush in-memory config to disk
   */
  async flush(configPath?: string): Promise<void> {
    if (!this.config) return;
    const path = configPath || this.getDefaultConfigPath();
    writeFileSync(path, JSON.stringify(this.config, null, 2), 'utf-8');
    this.logger.info(`Configuration flushed to: ${path}`);
  }

  /**
   * Find configuration file in default locations
   */
  private findConfigFile(): string | null {
    for (const configPath of this.defaultConfigPaths) {
      const fullPath = join(process.cwd(), configPath);
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }
    return null;
  }
}

// Factory type for ConfigurationManager
export type ConfigurationManagerFactory = () => ConfigurationManager;
