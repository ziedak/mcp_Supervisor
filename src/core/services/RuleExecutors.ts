/**
 * Rule Executor Factory and individual rule executors
 * Following SOLID principles with strategy pattern for different rule types
 */

import type { ILogger } from '../interfaces/ILogger';
import type { IPluginManager } from './PluginManager';
import type {
  SupervisorRuleType,
  ThresholdRuleType,
  PatternRuleType,
  AIRuleType,
  PluginRuleType,
  RuleResultType,
} from '../schemas/RuleEngineSchemas';
import {
  RuleExecutionError,
  RuleValidationError,
  PluginNotFoundError,
} from '../errors/RuleEngineErrors';
import { TYPES } from '../../config/types';
import { injectable, inject } from 'inversify';

/**
 * Rule executor interface
 */
export interface IRuleExecutor<
  T extends SupervisorRuleType = SupervisorRuleType,
> {
  readonly ruleType: T['type'];
  canExecute(rule: SupervisorRuleType): rule is T;
  validateRule(rule: T): Promise<void>;
  executeRule(rule: T, input: unknown): Promise<RuleResultType>;
}

/**
 * Rule executor factory interface
 */
export interface IRuleExecutorFactory {
  createExecutor(ruleType: SupervisorRuleType['type']): IRuleExecutor;
  registerExecutor(executor: IRuleExecutor): void;
  getAvailableTypes(): string[];
}

/**
 * Threshold rule executor
 */
@injectable()
export class ThresholdRuleExecutor implements IRuleExecutor<ThresholdRuleType> {
  readonly ruleType = 'threshold' as const;

  constructor(@inject(TYPES.Logger) private readonly logger: ILogger) {}

  canExecute(rule: SupervisorRuleType): rule is ThresholdRuleType {
    return rule.type === 'threshold';
  }

  async validateRule(rule: ThresholdRuleType): Promise<void> {
    if (rule.value < 0 || rule.value > 1) {
      throw new RuleValidationError(
        'Threshold value must be between 0 and 1',
        rule.id,
        { value: rule.value }
      );
    }

    if (!rule.target) {
      throw new RuleValidationError(
        'Target is required for threshold rules',
        rule.id
      );
    }
  }

  async executeRule(
    rule: ThresholdRuleType,
    input: unknown
  ): Promise<RuleResultType> {
    try {
      await this.validateRule(rule);

      this.logger.debug(`Executing threshold rule: ${rule.id}`);

      // Extract the value from input based on the target path
      const actualValue = this.extractValue(input, rule.target);

      if (typeof actualValue !== 'number') {
        throw new RuleExecutionError(
          `Target '${rule.target}' does not resolve to a number`,
          rule.id,
          { actualValue, target: rule.target }
        );
      }

      const passed = actualValue >= rule.value;
      const message =
        rule.message ||
        `Value ${actualValue} ${passed ? 'meets' : 'fails to meet'} threshold ${rule.value}`;

      return {
        passed,
        message,
        score: actualValue,
        data: {
          actualValue,
          threshold: rule.value,
          target: rule.target,
        },
      };
    } catch (error: unknown) {
      if (
        error instanceof RuleExecutionError ||
        error instanceof RuleValidationError
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new RuleExecutionError(
        `Threshold rule execution failed: ${errorMessage}`,
        rule.id,
        { originalError: error }
      );
    }
  }

  private extractValue(input: unknown, path: string): unknown {
    if (!input || typeof input !== 'object') {
      return undefined;
    }

    const keys = path.split('.');
    let current: any = input;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }
}

/**
 * Pattern rule executor
 */
export class PatternRuleExecutor implements IRuleExecutor<PatternRuleType> {
  readonly ruleType = 'pattern' as const;
  private readonly logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  canExecute(rule: SupervisorRuleType): rule is PatternRuleType {
    return rule.type === 'pattern';
  }

  async validateRule(rule: PatternRuleType): Promise<void> {
    if (!rule.pattern) {
      throw new RuleValidationError(
        'Pattern is required for pattern rules',
        rule.id
      );
    }

    if (!rule.target) {
      throw new RuleValidationError(
        'Target is required for pattern rules',
        rule.id
      );
    }

    // Validate regex pattern
    try {
      new RegExp(rule.pattern);
    } catch (error) {
      throw new RuleValidationError(
        `Invalid regex pattern: ${rule.pattern}`,
        rule.id,
        { pattern: rule.pattern }
      );
    }
  }

  async executeRule(
    rule: PatternRuleType,
    input: unknown
  ): Promise<RuleResultType> {
    try {
      await this.validateRule(rule);

      this.logger.debug(`Executing pattern rule: ${rule.id}`);

      // Extract the value from input based on the target path
      const targetValue = this.extractValue(input, rule.target);

      if (typeof targetValue !== 'string') {
        throw new RuleExecutionError(
          `Target '${rule.target}' does not resolve to a string`,
          rule.id,
          { targetValue, target: rule.target }
        );
      }

      const regex = new RegExp(rule.pattern);
      const matches = regex.exec(targetValue);
      const passed = matches !== null;

      const message =
        rule.message ||
        `Pattern ${rule.pattern} ${passed ? 'matches' : 'does not match'} target value`;

      return {
        passed,
        message,
        score: passed ? 1 : 0,
        data: {
          pattern: rule.pattern,
          target: rule.target,
          targetValue,
          matches: matches?.map(match => match) || [],
        },
      };
    } catch (error: unknown) {
      if (
        error instanceof RuleExecutionError ||
        error instanceof RuleValidationError
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new RuleExecutionError(
        `Pattern rule execution failed: ${errorMessage}`,
        rule.id,
        { originalError: error }
      );
    }
  }

  private extractValue(input: unknown, path: string): unknown {
    if (!input || typeof input !== 'object') {
      return undefined;
    }

    const keys = path.split('.');
    let current: any = input;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }
}

/**
 * AI rule executor
 */
export class AIRuleExecutor implements IRuleExecutor<AIRuleType> {
  readonly ruleType = 'ai' as const;
  private readonly logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  canExecute(rule: SupervisorRuleType): rule is AIRuleType {
    return rule.type === 'ai';
  }

  async validateRule(rule: AIRuleType): Promise<void> {
    if (!rule.agent) {
      throw new RuleValidationError('Agent is required for AI rules', rule.id);
    }

    if (!rule.instruction) {
      throw new RuleValidationError(
        'Instruction is required for AI rules',
        rule.id
      );
    }

    if (!rule.target) {
      throw new RuleValidationError('Target is required for AI rules', rule.id);
    }

    const validStrategies = ['analyze-and-instruct', 'refactor', 'validate'];
    if (!validStrategies.includes(rule.strategy)) {
      throw new RuleValidationError(
        `Invalid strategy '${rule.strategy}'. Must be one of: ${validStrategies.join(', ')}`,
        rule.id,
        { strategy: rule.strategy }
      );
    }
  }

  async executeRule(rule: AIRuleType, input: unknown): Promise<RuleResultType> {
    try {
      await this.validateRule(rule);

      this.logger.debug(`Executing AI rule: ${rule.id}`);

      // For now, this is a placeholder implementation
      // In a real implementation, this would integrate with an AI service
      this.logger.warn(`AI rule execution not yet implemented: ${rule.id}`);

      return {
        passed: false,
        message: `AI rule '${rule.id}' execution not yet implemented`,
        score: 0,
        data: {
          agent: rule.agent,
          strategy: rule.strategy,
          instruction: rule.instruction,
          target: rule.target,
        },
      };
    } catch (error: unknown) {
      if (
        error instanceof RuleExecutionError ||
        error instanceof RuleValidationError
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new RuleExecutionError(
        `AI rule execution failed: ${errorMessage}`,
        rule.id,
        { originalError: error }
      );
    }
  }
}

/**
 * Plugin rule executor
 */
export class PluginRuleExecutor implements IRuleExecutor<PluginRuleType> {
  readonly ruleType = 'plugin' as const;
  private readonly logger: ILogger;
  private readonly pluginManager: IPluginManager;

  constructor(logger: ILogger, pluginManager: IPluginManager) {
    this.logger = logger;
    this.pluginManager = pluginManager;
  }

  canExecute(rule: SupervisorRuleType): rule is PluginRuleType {
    return rule.type === 'plugin';
  }

  async validateRule(rule: PluginRuleType): Promise<void> {
    if (!rule.plugin) {
      throw new RuleValidationError(
        'Plugin path is required for plugin rules',
        rule.id
      );
    }

    // Check if plugin is loaded
    if (!this.pluginManager.hasPlugin(rule.plugin)) {
      throw new PluginNotFoundError(rule.plugin);
    }
  }

  async executeRule(
    rule: PluginRuleType,
    input: unknown
  ): Promise<RuleResultType> {
    try {
      await this.validateRule(rule);

      this.logger.debug(`Executing plugin rule: ${rule.id}`);

      // Execute the plugin with the rule configuration as plugin config
      const result = await this.pluginManager.executePlugin(
        rule.plugin,
        input,
        rule as any // Plugin config can be flexible
      );

      // Add plugin metadata to the result
      return {
        ...result,
        data: {
          ...result.data,
          plugin: rule.plugin,
          executedAt: new Date().toISOString(),
        },
      };
    } catch (error: unknown) {
      if (
        error instanceof RuleExecutionError ||
        error instanceof RuleValidationError
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new RuleExecutionError(
        `Plugin rule execution failed: ${errorMessage}`,
        rule.id,
        { originalError: error }
      );
    }
  }
}

/**
 * Rule executor factory implementation
 */
export class RuleExecutorFactory implements IRuleExecutorFactory {
  private readonly executors = new Map<string, IRuleExecutor>();
  private readonly logger: ILogger;

  constructor(
    @inject(TYPES.Logger) logger: ILogger,
    @inject(TYPES.PluginManager) pluginManager: IPluginManager
  ) {
    this.logger = logger;

    // Register built-in executors
    this.registerExecutor(new ThresholdRuleExecutor(logger));
    this.registerExecutor(new PatternRuleExecutor(logger));
    this.registerExecutor(new AIRuleExecutor(logger));
    this.registerExecutor(new PluginRuleExecutor(logger, pluginManager));
  }

  createExecutor(ruleType: SupervisorRuleType['type']): IRuleExecutor {
    const executor = this.executors.get(ruleType);
    if (!executor) {
      throw new RuleValidationError(
        `No executor available for rule type: ${ruleType}`,
        undefined,
        { ruleType }
      );
    }
    return executor;
  }

  registerExecutor(executor: IRuleExecutor): void {
    if (this.executors.has(executor.ruleType)) {
      this.logger.warn(
        `Overriding existing executor for rule type: ${executor.ruleType}`
      );
    }

    this.executors.set(executor.ruleType, executor);
    this.logger.debug(
      `Registered executor for rule type: ${executor.ruleType}`
    );
  }

  getAvailableTypes(): string[] {
    return Array.from(this.executors.keys());
  }
}
