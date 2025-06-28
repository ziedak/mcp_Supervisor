import {
  SupervisorConfigType,
  SupervisorRuleType,
  RuleExecutionContextType,
  RuleExecutionResult,
} from '../schemas/RuleEngineSchemas';

/**
 * Phase execution result
 */
export interface PhaseExecutionResult {
  phase: string;
  success: boolean;
  results: RuleExecutionResult[];
  hardFailures: RuleExecutionResult[];
  softFailures: RuleExecutionResult[];
  requiresHumanApproval: boolean;
}

/**
 * Interface for rule engine operations (modern implementation only)
 */
export interface IRuleEngine {
  /**
   * Load supervisor configuration from file path
   */
  loadConfig(configPath?: string): Promise<SupervisorConfigType>;

  /**
   * Get current supervisor configuration
   */
  getConfig(): SupervisorConfigType;

  /**
   * Execute rules for a specific phase
   */
  executePhase(
    phase: string,
    context: RuleExecutionContextType
  ): Promise<PhaseExecutionResult>;

  /**
   * Execute a specific rule
   */
  executeRule(
    ruleId: string,
    context: RuleExecutionContextType
  ): Promise<RuleExecutionResult>;

  /**
   * Execute a rule group
   */
  executeRuleGroup(
    groupName: string,
    context: RuleExecutionContextType
  ): Promise<RuleExecutionResult[]>;

  /**
   * Get all rules for a phase
   */
  getPhaseRules(phase: string): Promise<SupervisorRuleType[]>;

  /**
   * Get rules in a group
   */
  getRuleGroup(groupName: string): Promise<SupervisorRuleType[]>;

  /**
   * Validate a supervisor rule
   */
  validateSupervisorRule(rule: SupervisorRuleType): Promise<boolean>;

  /**
   * Check if a phase requires human approval
   */
  requiresHumanApproval(phase: string): Promise<boolean>;

  /**
   * Check if a phase requires a plan
   */
  requiresPlan(phase: string): Promise<boolean>;

  /**
   * Get required plan sections
   */
  getRequiredPlanSections(): Promise<string[]>;

  /**
   * Load and validate plugins
   */
  loadPlugins(): Promise<void>;

  /**
   * Get available plugin names
   */
  getAvailablePlugins(): string[];

  /**
   * Load a single plugin
   */
  loadPlugin(pluginPath: string): Promise<void>;

  /**
   * Unload a plugin
   */
  unloadPlugin(pluginName: string): Promise<void>;

  /**
   * Initialize the rule engine
   */
  initialize(): Promise<void>;

  /**
   * Cleanup resources
   */
  cleanup(): Promise<void>;
}
