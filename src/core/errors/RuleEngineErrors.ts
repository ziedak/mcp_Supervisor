/**
 * Custom error classes for the Rule Engine
 * Following SOLID principles with specific error types
 */

/**
 * Base class for all rule engine errors
 */
export abstract class RuleEngineError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, any>;

  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Configuration validation errors
 */
export class ConfigurationError extends RuleEngineError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', context);
  }
}

/**
 * Rule validation errors
 */
export class RuleValidationError extends RuleEngineError {
  constructor(message: string, ruleId?: string, context?: Record<string, any>) {
    super(message, 'RULE_VALIDATION_ERROR', { ruleId, ...context });
  }
}

/**
 * Rule execution errors
 */
export class RuleExecutionError extends RuleEngineError {
  constructor(message: string, ruleId: string, context?: Record<string, any>) {
    super(message, 'RULE_EXECUTION_ERROR', { ruleId, ...context });
  }
}

/**
 * Plugin loading/execution errors
 */
export class PluginError extends RuleEngineError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PLUGIN_ERROR', context);
  }
}

/**
 * Plugin loading errors
 */
export class PluginLoadError extends RuleEngineError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PLUGIN_LOAD_ERROR', context);
  }
}

/**
 * Phase execution errors
 */
export class PhaseExecutionError extends RuleEngineError {
  constructor(message: string, phase: string, context?: Record<string, any>) {
    super(message, 'PHASE_EXECUTION_ERROR', { phase, ...context });
  }
}

/**
 * Configuration not loaded error
 */
export class ConfigurationNotLoadedError extends RuleEngineError {
  constructor() {
    super(
      'Configuration not loaded. Call loadConfig() first.',
      'CONFIGURATION_NOT_LOADED'
    );
  }
}

/**
 * Rule not found error
 */
export class RuleNotFoundError extends RuleEngineError {
  constructor(ruleId: string) {
    super(`Rule '${ruleId}' not found`, 'RULE_NOT_FOUND', { ruleId });
  }
}

/**
 * Plugin not found error
 */
export class PluginNotFoundError extends RuleEngineError {
  constructor(pluginName: string) {
    super(
      `Plugin '${pluginName}' not found or not loaded`,
      'PLUGIN_NOT_FOUND',
      { pluginName }
    );
  }
}

/**
 * Phase not found error
 */
export class PhaseNotFoundError extends RuleEngineError {
  constructor(phase: string) {
    super(`Phase '${phase}' not found in configuration`, 'PHASE_NOT_FOUND', {
      phase,
    });
  }
}

/**
 * Rule group not found error
 */
export class RuleGroupNotFoundError extends RuleEngineError {
  constructor(groupName: string) {
    super(
      `Rule group '${groupName}' not found in configuration`,
      'RULE_GROUP_NOT_FOUND',
      { groupName }
    );
  }
}
