/**
 * RuleEngine Test Utilities
 * Real implementations for testing without mocking core logic
 * Validates actual behavior and outcomes
 */

import type { ILogger } from '../../src/core/interfaces/ILogger';
import type { IConfigurationManager } from '../../src/core/services/ConfigurationManager';
import type {
  IPluginManager,
  IRulePlugin,
} from '../../src/core/services/PluginManager';
import { PluginNotFoundError } from '../../src/core/errors/RuleEngineErrors';
import type {
  IRuleExecutorFactory,
  IRuleExecutor,
} from '../../src/core/services/RuleExecutors';
import type {
  SupervisorConfigType,
  SupervisorRuleType,
  RuleResultType,
  RuleExecutionContextType,
  PluginConfigType,
} from '../../src/core/schemas/RuleEngineSchemas';
import {
  ConfigurationNotLoadedError,
  PhaseNotFoundError,
  RuleGroupNotFoundError,
  RuleNotFoundError,
} from '../../src/core/errors/RuleEngineErrors';

/**
 * Test Logger - Captures logs for verification
 */
export class TestLogger implements ILogger {
  public logs: Array<{ level: string; message: string; timestamp: number }> =
    [];

  info(message: string): void {
    this.logs.push({ level: 'info', message, timestamp: Date.now() });
  }

  error(message: string): void {
    this.logs.push({ level: 'error', message, timestamp: Date.now() });
  }

  warn(message: string): void {
    this.logs.push({ level: 'warn', message, timestamp: Date.now() });
  }

  debug(message: string): void {
    this.logs.push({ level: 'debug', message, timestamp: Date.now() });
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogsByLevel(level: string): string[] {
    return this.logs.filter(log => log.level === level).map(log => log.message);
  }

  getLogsCount(level?: string): number {
    if (level) {
      return this.logs.filter(log => log.level === level).length;
    }
    return this.logs.length;
  }

  hasLogContaining(text: string, level?: string): boolean {
    const logsToCheck = level
      ? this.logs.filter(log => log.level === level)
      : this.logs;
    return logsToCheck.some(log => log.message.includes(text));
  }
}

/**
 * Test Configuration Manager - Manages real configuration state
 */
export class TestConfigurationManager implements IConfigurationManager {
  private config: SupervisorConfigType | null = null;
  private configLoaded = false;

  async loadConfig(configPath?: string): Promise<SupervisorConfigType> {
    // Create a realistic test configuration
    const testConfig: SupervisorConfigType = {
      plan: {
        requiredSections: ['problem', 'solution', 'implementation', 'testing'],
      },
      phases: {
        draft: {
          enforce: [],
          requirePlan: false,
          requireHumanApproval: false,
        },
        planned: {
          enforce: ['rule:plan-complete'],
          requirePlan: true,
          requireHumanApproval: false,
        },
        coded: {
          enforce: ['rule:test-coverage', 'group:code-quality'],
          requirePlan: true,
          requireHumanApproval: false,
        },
        reviewed: {
          enforce: ['group:security', 'rule:ai-review'],
          requirePlan: true,
          requireHumanApproval: true,
        },
        production: {
          enforce: ['group:production-ready'],
          requirePlan: true,
          requireHumanApproval: true,
        },
      },
      rules: {
        'plan-complete': {
          id: 'plan-complete',
          type: 'ai',
          agent: 'copilot',
          strategy: 'validate',
          instruction:
            'Validate that all required plan sections are complete and detailed',
          target: 'plan',
          enforcement: 'hard',
        },
        'test-coverage': {
          id: 'test-coverage',
          type: 'threshold',
          target: 'test.coverage',
          value: 0.8,
          enforcement: 'hard',
          message: 'Test coverage must be at least 80%',
        },
        'branch-coverage': {
          id: 'branch-coverage',
          type: 'threshold',
          target: 'test.branch-coverage',
          value: 0.75,
          enforcement: 'hard',
          message: 'Branch coverage must be at least 75%',
        },
        'no-console': {
          id: 'no-console',
          type: 'pattern',
          pattern: 'console\\.(log|error|warn|info)',
          target: 'code',
          enforcement: 'soft',
          message: 'Avoid console statements in production code',
        },
        'no-debugger': {
          id: 'no-debugger',
          type: 'pattern',
          pattern: 'debugger;',
          target: 'code',
          enforcement: 'hard',
          message: 'Remove debugger statements before production',
        },
        'complexity-check': {
          id: 'complexity-check',
          type: 'threshold',
          target: 'code.complexity',
          value: 0.1,
          enforcement: 'soft',
          message: 'Keep code complexity manageable',
        },
        'security-scan': {
          id: 'security-scan',
          type: 'plugin',
          plugin: './security-scanner.js',
          enforcement: 'hard',
          message: 'Security vulnerabilities must be resolved',
        },
        'dependency-audit': {
          id: 'dependency-audit',
          type: 'plugin',
          plugin: './dependency-auditor.js',
          enforcement: 'hard',
          message: 'Dependencies must be secure and up-to-date',
        },
        'ai-review': {
          id: 'ai-review',
          type: 'ai',
          agent: 'copilot',
          strategy: 'analyze-and-instruct',
          instruction:
            'Review code for best practices, maintainability, and potential issues',
          target: 'code',
          enforcement: 'soft',
          refactorAllowed: false,
        },
        'performance-check': {
          id: 'performance-check',
          type: 'threshold',
          target: 'performance.score',
          value: 0.8,
          enforcement: 'soft',
          message: 'Maintain good performance metrics',
        },
        // --- NEW RULE TYPES FOR TESTING ---
        'commit-msg-pattern': {
          id: 'commit-msg-pattern',
          type: 'commit-message',
          pattern: '^feat|fix|chore|docs: .+',
          enforcement: 'hard',
          message:
            'Commit message must start with feat|fix|chore|docs: and a description',
        },
        'security-deps': {
          id: 'security-deps',
          type: 'security-posture',
          check: 'dependency-scan',
          enforcement: 'hard',
          message: 'Dependencies must pass security scan',
        },
        'structure-required': {
          id: 'structure-required',
          type: 'structure',
          requiredFiles: ['README.md', 'package.json'],
          requiredDirectories: ['src', 'tests'],
          enforcement: 'hard',
          message:
            'Project must have README.md, package.json, src/, and tests/',
        },
        // --- END NEW RULE TYPES ---
      },
      ruleGroups: {
        'code-quality': [
          'test-coverage',
          'branch-coverage',
          'no-console',
          'no-debugger',
          'complexity-check',
        ],
        security: ['security-scan', 'dependency-audit'],
        'production-ready': [
          'test-coverage',
          'branch-coverage',
          'no-debugger',
          'security-scan',
          'dependency-audit',
          'performance-check',
        ],
        compliance: [
          'commit-msg-pattern',
          'security-deps',
          'structure-required',
        ],
      },
      extensions: {
        plugins: ['./test-plugin.js', './security-scanner.js'],
      },
      defaults: {
        enforcement: 'soft',
      },
    };

    this.config = testConfig;
    this.configLoaded = true;
    return testConfig;
  }

  getConfig(): SupervisorConfigType {
    if (!this.configLoaded || !this.config) {
      throw new ConfigurationNotLoadedError();
    }
    return this.config;
  }

  isConfigLoaded(): boolean {
    return this.configLoaded;
  }

  validateConfig(config: unknown): SupervisorConfigType {
    if (typeof config !== 'object' || config === null) {
      throw new Error('Invalid configuration: must be an object');
    }
    return config as SupervisorConfigType;
  }

  getDefaultConfigPath(): string {
    return '.supervisorrc.json';
  }

  // Test utilities
  setConfig(config: SupervisorConfigType): void {
    this.config = config;
    this.configLoaded = true;
  }

  resetConfig(): void {
    this.config = null;
    this.configLoaded = false;
  }

  addRule(rule: SupervisorRuleType): void {
    if (this.config) {
      this.config.rules[rule.id] = rule;
    }
  }

  addRuleGroup(name: string, ruleIds: string[]): void {
    if (this.config) {
      this.config.ruleGroups[name] = ruleIds;
    }
  }

  /**
   * Simulate creation of a default config file for testing purposes.
   * Returns the path where the config would be written.
   * No actual file I/O is performed in the test environment.
   */
  async createDefaultConfig(path?: string): Promise<string> {
    // Simulate writing a default config file (no real file I/O for tests)
    this.config = await this.loadConfig();
    this.configLoaded = true;
    // Return the provided path or the default config path
    return path || this.getDefaultConfigPath();
  }
}

/**
 * Test Plugin Manager - Manages real plugin instances
 */
export class TestPluginManager implements IPluginManager {
  private plugins = new Map<string, IRulePlugin>();
  private loadedPlugins: string[] = [];

  async loadPlugin(pluginPath: string): Promise<IRulePlugin> {
    // Create realistic test plugins based on path
    const plugin = this.createTestPlugin(pluginPath);
    this.plugins.set(pluginPath, plugin);
    if (!this.loadedPlugins.includes(pluginPath)) {
      this.loadedPlugins.push(pluginPath);
    }
    return plugin;
  }

  async loadPluginsFromDirectory(directory: string): Promise<IRulePlugin[]> {
    // Simulate loading multiple plugins
    const pluginPaths = [`${directory}/plugin1.js`, `${directory}/plugin2.js`];
    const plugins: IRulePlugin[] = [];
    for (const path of pluginPaths) {
      plugins.push(await this.loadPlugin(path));
    }
    return plugins;
  }

  async unloadPlugin(name: string): Promise<void> {
    this.plugins.delete(name);
    this.loadedPlugins = this.loadedPlugins.filter(p => p !== name);
  }

  getPlugin(name: string): IRulePlugin {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new PluginNotFoundError(name);
    }
    return plugin;
  }

  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  listPlugins(): string[] {
    return this.loadedPlugins;
  }

  async executePlugin(
    name: string,
    input: unknown,
    config: PluginConfigType
  ): Promise<RuleResultType> {
    const plugin = this.getPlugin(name);
    return await plugin.execute(input, config);
  }

  validatePluginConfig(name: string, config: PluginConfigType): boolean {
    const plugin = this.plugins.get(name);
    return plugin?.validate?.(config) ?? true;
  }

  async initializePlugins(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.init?.();
    }
  }

  async cleanupPlugins(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.cleanup?.();
    }
    this.plugins.clear();
    this.loadedPlugins = [];
  }

  public createTestPlugin(pluginPath: string): IRulePlugin {
    return {
      name: pluginPath,
      version: '1.0.0',
      description: `Test plugin for ${pluginPath}`,

      async execute(
        input: unknown,
        config: PluginConfigType
      ): Promise<RuleResultType> {
        // Simulate different plugin behaviors based on path
        if (pluginPath.includes('security')) {
          return {
            passed: true,
            message: 'Security scan completed successfully',
            score: 0.95,
            data: { vulnerabilities: 0, warnings: 2 },
          };
        } else if (pluginPath.includes('dependency')) {
          return {
            passed: true,
            message: 'Dependency audit completed',
            score: 0.9,
            data: { outdated: 1, vulnerable: 0 },
          };
        } else {
          return {
            passed: true,
            message: `Plugin ${pluginPath} executed successfully`,
            score: 0.85,
            data: { pluginPath, executedAt: new Date().toISOString() },
          };
        }
      },

      validate(config: PluginConfigType): boolean {
        return typeof config === 'object';
      },

      async init(): Promise<void> {
        // Initialization logic
      },

      async cleanup(): Promise<void> {
        // Cleanup logic
      },
    };
  }
}

/**
 * Test Rule Executor Factory - Creates real rule executors
 */
export class TestRuleExecutorFactory implements IRuleExecutorFactory {
  private executors = new Map<string, IRuleExecutor>();

  constructor(pluginManager?: TestPluginManager) {
    // Register default executors
    this.registerExecutor(new TestThresholdExecutor());
    this.registerExecutor(new TestPatternExecutor());
    this.registerExecutor(new TestAIExecutor());
    this.registerExecutor(
      new TestPluginExecutor(pluginManager || new TestPluginManager())
    );
  }

  createExecutor(ruleType: SupervisorRuleType['type']): IRuleExecutor {
    const executor = this.executors.get(ruleType);
    if (!executor) {
      throw new Error(`No executor found for rule type: ${ruleType}`);
    }
    return executor;
  }

  registerExecutor(executor: IRuleExecutor): void {
    this.executors.set(executor.ruleType, executor);
  }

  getAvailableTypes(): string[] {
    return Array.from(this.executors.keys());
  }
}

/**
 * Test Rule Executors - Realistic implementations
 */
class TestThresholdExecutor implements IRuleExecutor {
  readonly ruleType = 'threshold' as const;

  canExecute(rule: SupervisorRuleType): rule is any {
    return rule.type === 'threshold';
  }

  async validateRule(rule: any): Promise<void> {
    if (!rule.target || rule.value === undefined) {
      throw new Error('Threshold rule must have target and value');
    }
  }

  async executeRule(rule: any, input: unknown): Promise<RuleResultType> {
    const context = input as RuleExecutionContextType;
    const targetParts = rule.target.split('.');
    let targetValue: number | undefined;

    // First, try to find the target as a direct key in metrics
    if (context.metrics?.[rule.target] !== undefined) {
      targetValue = context.metrics[rule.target];
    } else if (targetParts.length === 2 && targetParts[0] === 'test') {
      // Handle test.coverage, test.branch-coverage, etc.
      const metricKey = targetParts[1];
      targetValue = context.metrics?.[metricKey];
    } else if (targetParts.length === 2) {
      // Handle other patterns like code.complexity
      targetValue = this.getNestedValue(context, targetParts);
    } else {
      // Direct metric access
      targetValue = context.metrics?.[rule.target];
    }

    if (targetValue === undefined || targetValue === null) {
      return {
        passed: false,
        message: `Target ${rule.target} not found in context`,
        score: 0,
        data: {
          target: rule.target,
          threshold: rule.value,
          error: 'Target not found',
        },
      };
    }

    const passed = this.evaluateThreshold(rule, targetValue);
    const comparisonType = this.getComparisonType(rule);
    return {
      passed,
      message: passed
        ? `Threshold met: ${targetValue} ${comparisonType === 'lte' ? '<=' : '>='} ${rule.value}`
        : `Threshold not met: ${targetValue} ${comparisonType === 'lte' ? '>' : '<'} ${rule.value}`,
      score: targetValue,
      data: { targetValue, threshold: rule.value, target: rule.target },
    };
  }

  private evaluateThreshold(rule: any, targetValue: number): boolean {
    const comparisonType = this.getComparisonType(rule);
    return comparisonType === 'lte'
      ? targetValue <= rule.value
      : targetValue >= rule.value;
  }

  private getComparisonType(rule: any): 'gte' | 'lte' {
    // Use heuristics to determine comparison type
    const lowerBoundIndicators = [
      'complexity',
      'error',
      'bug',
      'debt',
      'violation',
      'issue',
    ];
    const target = rule.target?.toLowerCase() || '';
    const id = rule.id?.toLowerCase() || '';

    return lowerBoundIndicators.some(
      indicator => target.includes(indicator) || id.includes(indicator)
    )
      ? 'lte'
      : 'gte';
  }

  private getNestedValue(obj: any, path: string[]): number | undefined {
    let current = obj;
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    return typeof current === 'number' ? current : undefined;
  }
}

class TestPatternExecutor implements IRuleExecutor {
  readonly ruleType = 'pattern' as const;

  canExecute(rule: SupervisorRuleType): rule is any {
    return rule.type === 'pattern';
  }

  async validateRule(rule: any): Promise<void> {
    if (!rule.pattern || !rule.target) {
      throw new Error('Pattern rule must have pattern and target');
    }
  }

  async executeRule(rule: any, input: unknown): Promise<RuleResultType> {
    const context = input as RuleExecutionContextType;
    const targetContent = this.getTargetContent(context, rule.target);

    if (!targetContent) {
      return {
        passed: false,
        message: `Target ${rule.target} not found or empty`,
        score: 0,
        data: { pattern: rule.pattern, target: rule.target },
      };
    }

    const regex = new RegExp(rule.pattern, 'g');
    const matches = targetContent.match(regex);
    const matchCount = matches ? matches.length : 0;
    const passed = matchCount === 0;

    return {
      passed,
      message: passed
        ? `Pattern check passed: No matches for ${rule.pattern}`
        : `Pattern check failed: Found ${matchCount} matches for ${rule.pattern}`,
      score: passed ? 1 : Math.max(0, 1 - matchCount * 0.1),
      data: { pattern: rule.pattern, matches: matchCount, target: rule.target },
    };
  }

  private getTargetContent(
    context: RuleExecutionContextType,
    target: string
  ): string {
    switch (target) {
      case 'code':
        return context.code || '';
      case 'plan':
        return context.metadata?.plan || '';
      default:
        return '';
    }
  }
}

class TestAIExecutor implements IRuleExecutor {
  readonly ruleType = 'ai' as const;

  canExecute(rule: SupervisorRuleType): rule is any {
    return rule.type === 'ai';
  }

  async validateRule(rule: any): Promise<void> {
    if (!rule.agent || !rule.strategy || !rule.instruction) {
      throw new Error('AI rule must have agent, strategy, and instruction');
    }
  }

  async executeRule(rule: any, input: unknown): Promise<RuleResultType> {
    const context = input as RuleExecutionContextType;

    // Simulate AI analysis with realistic logic
    const targetContent = this.getTargetContent(context, rule.target);
    const analysis = this.performAIAnalysis(rule, targetContent);

    return {
      passed: analysis.passed,
      message: analysis.message,
      score: analysis.score,
      data: {
        agent: rule.agent,
        strategy: rule.strategy,
        instruction: rule.instruction,
        analysis: analysis.details,
      },
    };
  }

  private getTargetContent(
    context: RuleExecutionContextType,
    target: string
  ): string {
    switch (target) {
      case 'code':
        return context.code || '';
      case 'plan':
        return context.metadata?.plan || '';
      default:
        return '';
    }
  }

  private performAIAnalysis(rule: any, content: string): any {
    // Simulate AI analysis based on content characteristics
    const complexity = content.length / 100;
    const hasIssues =
      content.includes('TODO') ||
      content.includes('FIXME') ||
      content.includes('hack');
    const score = Math.max(
      0.1,
      Math.min(1, 1 - complexity * 0.1 - (hasIssues ? 0.3 : 0))
    );

    return {
      passed: score >= 0.7,
      score,
      message:
        score >= 0.7
          ? `AI analysis passed: Content meets quality standards`
          : `AI analysis suggests improvements needed`,
      details: {
        complexity,
        hasIssues,
        suggestions:
          score < 0.7
            ? ['Consider refactoring complex sections', 'Address TODO items']
            : [],
      },
    };
  }
}

class TestPluginExecutor implements IRuleExecutor {
  readonly ruleType = 'plugin' as const;

  constructor(private pluginManager: TestPluginManager) {}

  canExecute(rule: SupervisorRuleType): rule is any {
    return rule.type === 'plugin';
  }

  async validateRule(rule: any): Promise<void> {
    if (!rule.plugin) {
      throw new Error('Plugin rule must have plugin path');
    }
  }

  async executeRule(rule: any, input: unknown): Promise<RuleResultType> {
    // Try to get the plugin, handle the case where it might not exist
    let plugin: IRulePlugin | undefined;

    try {
      plugin = this.pluginManager.getPlugin(rule.plugin);
    } catch (error) {
      // Plugin not found, try to load it
      try {
        plugin = await this.pluginManager.loadPlugin(rule.plugin);
      } catch (loadError) {
        // If loading fails, provide a reasonable default behavior
        console.warn(
          `Plugin ${rule.plugin} could not be loaded, using default behavior`
        );
      }
    }

    if (plugin) {
      try {
        const result = await plugin.execute(input, {});
        return {
          passed: result.passed,
          message: result.message,
          score: result.score || 0,
          data: {
            ...result.data,
            plugin: rule.plugin,
            executedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          passed: false,
          message: `Plugin execution failed: ${error.message}`,
          score: 0,
          data: { plugin: rule.plugin, error: error.message },
        };
      }
    }

    // Fallback to default plugin behavior if plugin not found/loadable
    // Use the createTestPlugin logic to simulate appropriate plugin behavior
    const fallbackPlugin = this.pluginManager.createTestPlugin(rule.plugin);
    try {
      const result = await fallbackPlugin.execute(input, {});
      return {
        passed: result.passed,
        message: result.message,
        score: result.score || 0,
        data: {
          ...result.data,
          plugin: rule.plugin,
          executedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        passed: false,
        message: `Plugin fallback execution failed: ${error.message}`,
        score: 0,
        data: { plugin: rule.plugin, error: error.message },
      };
    }
  }
}

/**
 * Test Configuration Factory - Creates various test configurations
 */
export class TestConfigurationFactory {
  static createMinimalConfig(): SupervisorConfigType {
    return {
      plan: {
        requiredSections: ['problem'],
      },
      phases: {
        draft: {
          enforce: [],
          requirePlan: false,
          requireHumanApproval: false,
        },
      },
      rules: {},
      ruleGroups: {},
      extensions: {
        plugins: [],
      },
      defaults: {
        enforcement: 'soft',
      },
    };
  }

  static createComplexConfig(): SupervisorConfigType {
    return {
      plan: {
        requiredSections: [
          'problem',
          'solution',
          'implementation',
          'testing',
          'deployment',
          'monitoring',
        ],
      },
      phases: {
        draft: { enforce: [], requirePlan: false, requireHumanApproval: false },
        planned: {
          enforce: ['rule:plan-complete'],
          requirePlan: true,
          requireHumanApproval: false,
        },
        coded: {
          enforce: ['group:development'],
          requirePlan: true,
          requireHumanApproval: false,
        },
        tested: {
          enforce: ['group:testing'],
          requirePlan: true,
          requireHumanApproval: false,
        },
        reviewed: {
          enforce: ['group:quality'],
          requirePlan: true,
          requireHumanApproval: true,
        },
        staged: {
          enforce: ['group:pre-production'],
          requirePlan: true,
          requireHumanApproval: true,
        },
        production: {
          enforce: ['group:production'],
          requirePlan: true,
          requireHumanApproval: true,
        },
      },
      rules: {
        'plan-complete': {
          id: 'plan-complete',
          type: 'ai',
          agent: 'copilot',
          strategy: 'validate',
          instruction: 'Validate plan completeness',
          target: 'plan',
          enforcement: 'hard',
        },
        'unit-tests': {
          id: 'unit-tests',
          type: 'threshold',
          target: 'test.unit-coverage',
          value: 0.9,
          enforcement: 'hard',
        },
        'integration-tests': {
          id: 'integration-tests',
          type: 'threshold',
          target: 'test.integration-coverage',
          value: 0.8,
          enforcement: 'hard',
        },
        'no-secrets': {
          id: 'no-secrets',
          type: 'pattern',
          pattern: '(password|secret|key)\\s*=\\s*["\'][^"\']+["\']',
          target: 'code',
          enforcement: 'hard',
        },
        'security-scan': {
          id: 'security-scan',
          type: 'plugin',
          plugin: './security.js',
          enforcement: 'hard',
        },
        performance: {
          id: 'performance',
          type: 'threshold',
          target: 'performance.score',
          value: 0.8,
          enforcement: 'soft',
        },
      },
      ruleGroups: {
        development: ['unit-tests', 'no-secrets'],
        testing: ['unit-tests', 'integration-tests'],
        quality: ['security-scan', 'performance'],
        'pre-production': ['unit-tests', 'integration-tests', 'security-scan'],
        production: [
          'unit-tests',
          'integration-tests',
          'security-scan',
          'performance',
        ],
      },
      extensions: {
        plugins: ['./security.js', './performance.js'],
      },
      defaults: {
        enforcement: 'soft',
      },
    };
  }
}

/**
 * Test Context Factory - Creates various test contexts
 */
export class TestContextFactory {
  static createBasicContext(): RuleExecutionContextType {
    return {
      phase: 'coded',
      target: 'code',
      code: 'function hello() { return "world"; }',
      metrics: {
        coverage: 0.85,
        'branch-coverage': 0.8,
        'code.complexity': 0.05,
      },
    };
  }

  static createComplexContext(): RuleExecutionContextType {
    return {
      phase: 'production',
      target: 'code',
      code: `
        function complexFunction(data) {
          if (!data) return null;
          
          const result = data.map(item => {
            if (item.type === 'special') {
              return processSpecialItem(item);
            }
            return processNormalItem(item);
          });
          
          return result.filter(item => item !== null);
        }
      `,
      metrics: {
        coverage: 0.92,
        'branch-coverage': 0.88,
        'unit-coverage': 0.95,
        'integration-coverage': 0.85,
        'code.complexity': 0.05,
        performance: { score: 0.87 },
      },
      metadata: {
        plan: 'Complete plan with all required sections...',
        performance: { score: 0.87 },
      },
    };
  }

  static createFailingContext(): RuleExecutionContextType {
    return {
      phase: 'coded',
      target: 'code',
      code: `
        function badCode() {
          console.log("debug info");
          debugger;
          const password = "secret123";
          // TODO: fix this hack
          return hackySolution();
        }
      `,
      metrics: {
        coverage: 0.45,
        'branch-coverage': 0.32,
        complexity: 0.8,
      },
    };
  }
}
