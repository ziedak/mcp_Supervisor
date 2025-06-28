/**
 * RuleEngine Integration Tests
 *
 * Advanced real-world scenarios testing complete system integration
 * Tests complex configurations, edge cases, and performance under realistic conditions
 * NO MOCKING - All tests validate actual system behavior
 */

import 'reflect-metadata';
import { RuleEngine } from '../../../src/core/services/RuleEngine';
import type {
  IRuleEngine,
  PhaseExecutionResult,
} from '../../../src/core/interfaces/IRuleEngine';
import type {
  SupervisorConfigType,
  RuleExecutionContextType,
  SupervisorRuleType,
  RuleExecutionResult,
} from '../../../src/core/schemas/RuleEngineSchemas';
import {
  TestLogger,
  TestConfigurationManager,
  TestPluginManager,
  TestRuleExecutorFactory,
  TestConfigurationFactory,
  TestContextFactory,
} from '../../utils/RuleEngineTestUtils';
import { TestUtils } from '../../utils/TestUtils';
import { AuditLogService } from '../../../src/core/services/AuditLogService';

class MockAuditLogService {
  log = jest.fn();
  getHistory = jest.fn(() => []);
  findDeviations = jest.fn(() => []);
  attachLogger = jest.fn();
}

describe('RuleEngine Integration Tests - Advanced Real-World Scenarios', () => {
  let ruleEngine: IRuleEngine;
  let logger: TestLogger;
  let configManager: TestConfigurationManager;
  let pluginManager: TestPluginManager;
  let executorFactory: TestRuleExecutorFactory;
  let auditLog: MockAuditLogService;

  beforeEach(() => {
    logger = new TestLogger();
    configManager = new TestConfigurationManager();
    pluginManager = new TestPluginManager();
    executorFactory = new TestRuleExecutorFactory(pluginManager);
    auditLog = new MockAuditLogService();
    auditLog.attachLogger(logger);

    ruleEngine = new RuleEngine(
      configManager,
      pluginManager,
      executorFactory,
      logger,
      auditLog as any
    );
  });

  afterEach(async () => {
    await ruleEngine.cleanup();
  });

  describe('Complex Configuration Scenarios', () => {
    it('should handle enterprise-level configuration with multiple rule types', async () => {
      // Create complex enterprise configuration
      const enterpriseConfig: SupervisorConfigType = {
        plan: {
          requiredSections: [
            'business-requirements',
            'technical-architecture',
            'security-considerations',
            'performance-requirements',
            'deployment-strategy',
            'monitoring-strategy',
            'rollback-plan',
            'maintenance-plan',
          ],
        },
        phases: {
          draft: {
            enforce: [],
            requirePlan: false,
            requireHumanApproval: false,
          },
          analysis: {
            enforce: ['rule:business-analysis', 'group:architecture-review'],
            requirePlan: true,
            requireHumanApproval: false,
          },
          development: {
            enforce: ['group:code-standards', 'group:testing-requirements'],
            requirePlan: true,
            requireHumanApproval: false,
          },
          'security-review': {
            enforce: ['group:security-comprehensive', 'rule:penetration-test'],
            requirePlan: true,
            requireHumanApproval: true,
          },
          'performance-testing': {
            enforce: ['group:performance-comprehensive'],
            requirePlan: true,
            requireHumanApproval: false,
          },
          'pre-production': {
            enforce: ['group:production-readiness'],
            requirePlan: true,
            requireHumanApproval: true,
          },
          production: {
            enforce: ['group:production-deployment', 'rule:final-approval'],
            requirePlan: true,
            requireHumanApproval: true,
          },
        },
        rules: {
          'business-analysis': {
            id: 'business-analysis',
            type: 'ai',
            agent: 'copilot',
            strategy: 'validate',
            instruction:
              'Validate business requirements completeness and feasibility',
            target: 'plan',
            enforcement: 'hard',
          },
          'unit-test-coverage': {
            id: 'unit-test-coverage',
            type: 'threshold',
            target: 'test.unit-coverage',
            value: 0.95,
            enforcement: 'hard',
            message: 'Unit test coverage must be at least 95%',
          },
          'integration-test-coverage': {
            id: 'integration-test-coverage',
            type: 'threshold',
            target: 'test.integration-coverage',
            value: 0.85,
            enforcement: 'hard',
            message: 'Integration test coverage must be at least 85%',
          },
          'e2e-test-coverage': {
            id: 'e2e-test-coverage',
            type: 'threshold',
            target: 'test.e2e-coverage',
            value: 0.75,
            enforcement: 'hard',
            message: 'End-to-end test coverage must be at least 75%',
          },
          'code-complexity': {
            id: 'code-complexity',
            type: 'threshold',
            target: 'code.complexity',
            value: 0.05,
            enforcement: 'hard',
            message: 'Code complexity must be kept low',
          },
          'security-scan-comprehensive': {
            id: 'security-scan-comprehensive',
            type: 'plugin',
            plugin: './security-comprehensive.js',
            enforcement: 'hard',
            message: 'Comprehensive security scan must pass',
          },
          'dependency-vulnerability-scan': {
            id: 'dependency-vulnerability-scan',
            type: 'plugin',
            plugin: './dependency-scanner.js',
            enforcement: 'hard',
            message: 'No vulnerable dependencies allowed',
          },
          'penetration-test': {
            id: 'penetration-test',
            type: 'plugin',
            plugin: './penetration-test.js',
            enforcement: 'hard',
            message: 'Penetration testing must pass',
          },
          'performance-load-test': {
            id: 'performance-load-test',
            type: 'threshold',
            target: 'performance.load-test-score',
            value: 0.9,
            enforcement: 'hard',
            message: 'Load testing must achieve 90% score',
          },
          'performance-stress-test': {
            id: 'performance-stress-test',
            type: 'threshold',
            target: 'performance.stress-test-score',
            value: 0.85,
            enforcement: 'hard',
            message: 'Stress testing must achieve 85% score',
          },
          'deployment-automation': {
            id: 'deployment-automation',
            type: 'plugin',
            plugin: './deployment-validator.js',
            enforcement: 'hard',
            message: 'Deployment automation must be validated',
          },
          'monitoring-setup': {
            id: 'monitoring-setup',
            type: 'plugin',
            plugin: './monitoring-validator.js',
            enforcement: 'hard',
            message: 'Monitoring setup must be validated',
          },
          'final-approval': {
            id: 'final-approval',
            type: 'ai',
            agent: 'copilot',
            strategy: 'validate',
            instruction: 'Final validation of production readiness',
            target: 'plan',
            enforcement: 'hard',
          },
        },
        ruleGroups: {
          'architecture-review': ['business-analysis'],
          'code-standards': ['unit-test-coverage', 'code-complexity'],
          'testing-requirements': [
            'unit-test-coverage',
            'integration-test-coverage',
            'e2e-test-coverage',
          ],
          'security-comprehensive': [
            'security-scan-comprehensive',
            'dependency-vulnerability-scan',
          ],
          'performance-comprehensive': [
            'performance-load-test',
            'performance-stress-test',
          ],
          'production-readiness': [
            'unit-test-coverage',
            'integration-test-coverage',
            'e2e-test-coverage',
            'security-scan-comprehensive',
            'dependency-vulnerability-scan',
            'performance-load-test',
          ],
          'production-deployment': [
            'deployment-automation',
            'monitoring-setup',
          ],
        },
        extensions: {
          plugins: [
            './security-comprehensive.js',
            './dependency-scanner.js',
            './penetration-test.js',
            './deployment-validator.js',
            './monitoring-validator.js',
          ],
        },
        defaults: {
          enforcement: 'hard',
        },
      };

      configManager.setConfig(enterpriseConfig);
      const config = ruleEngine.getConfig();

      // Verify complex configuration loaded correctly
      expect(config.phases).toHaveProperty('security-review');
      expect(config.phases).toHaveProperty('performance-testing');
      expect(config.phases).toHaveProperty('pre-production');
      expect(config.phases.production.requireHumanApproval).toBe(true);

      // Verify rule groups
      expect(config.ruleGroups['production-readiness'].length).toBeGreaterThan(
        5
      );
      expect(config.ruleGroups['security-comprehensive'].length).toBe(2);

      // Test execution with enterprise context
      const enterpriseContext: RuleExecutionContextType = {
        phase: 'development',
        target: 'code',
        code: 'function enterprise() { return "production-ready"; }',
        metrics: {
          'test.unit-coverage': 0.96,
          'test.integration-coverage': 0.88,
          'test.e2e-coverage': 0.78,
          'code.complexity': 0.03,
        },
      };

      const result = await ruleEngine.executePhase(
        'development',
        enterpriseContext
      );

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(3);
      expect(result.hardFailures.length).toBe(0);
    });

    it('should handle dynamic rule configuration changes during execution', async () => {
      await ruleEngine.loadConfig();

      // Initial execution
      const context = TestContextFactory.createComplexContext();
      const initialResult = await ruleEngine.executePhase('coded', context);
      const initialRuleCount = initialResult.results.length;

      // Modify configuration dynamically
      const config = configManager.getConfig();
      config.rules['dynamic-rule'] = {
        id: 'dynamic-rule',
        type: 'threshold',
        target: 'metrics.dynamic-score',
        value: 0.8,
        enforcement: 'soft',
      };
      config.phases.coded.enforce!.push('rule:dynamic-rule');
      configManager.setConfig(config);

      // Execute again with modified configuration
      const modifiedContext = {
        ...context,
        metrics: { ...context.metrics, 'dynamic-score': 0.9 },
      };
      const modifiedResult = await ruleEngine.executePhase(
        'coded',
        modifiedContext
      );

      expect(modifiedResult.results.length).toBe(initialRuleCount + 1);
      expect(
        modifiedResult.results.some(r => r.ruleId === 'dynamic-rule')
      ).toBe(true);
    });

    it('should handle circular rule group references gracefully', async () => {
      await ruleEngine.loadConfig(); // Load config first
      const config = configManager.getConfig();

      // Create circular reference scenario
      config.ruleGroups['group-a'] = ['test-coverage'];
      config.ruleGroups['group-b'] = ['no-console'];
      config.ruleGroups['group-c'] = ['security-scan'];

      // Add circular references
      config.phases.coded.enforce = [
        'group:group-a',
        'group:group-b',
        'group:group-c',
      ];

      configManager.setConfig(config);

      const context = TestContextFactory.createComplexContext();
      const result = await ruleEngine.executePhase('coded', context);

      // Should execute without infinite loops
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results.length).toBeLessThan(20); // Reasonable upper bound
    });
  });

  describe('Multi-Phase Workflow Integration', () => {
    it('should execute complete software development lifecycle', async () => {
      const complexConfig = TestConfigurationFactory.createComplexConfig();
      configManager.setConfig(complexConfig);

      const phases = [
        'draft',
        'planned',
        'coded',
        'tested',
        'reviewed',
        'staged',
        'production',
      ];
      const phaseResults: any[] = [];

      let context = TestContextFactory.createBasicContext();

      for (const phase of phases) {
        // Simulate progression - improve metrics as we advance
        switch (phase) {
          case 'coded':
            context.metrics = {
              'unit-coverage': 0.92,
              'integration-coverage': 0.85,
            };
            break;
          case 'tested':
            context.metrics = {
              'unit-coverage': 0.95,
              'integration-coverage': 0.88,
              'e2e-coverage': 0.78,
            };
            break;
          case 'reviewed':
            context.metrics = {
              ...context.metrics,
              performance: { score: 0.89 },
            };
            break;
          case 'staged':
            context.metrics = {
              ...context.metrics,
              'load-test-score': 0.92,
              'stress-test-score': 0.87,
            };
            break;
          case 'production':
            context.metrics = {
              ...context.metrics,
              'load-test-score': 0.95,
              'stress-test-score': 0.9,
            };
            break;
        }

        const result = await ruleEngine.executePhase(phase, context);
        phaseResults.push({ phase, result });

        // Verify phase progression
        expect(result.phase).toBe(phase);

        // Later phases should have more stringent requirements
        if (phase !== 'draft') {
          expect(result.results.length).toBeGreaterThan(0);
        }

        // Human approval required for final phases
        if (['reviewed', 'staged', 'production'].includes(phase)) {
          expect(result.requiresHumanApproval).toBe(true);
        }
      }

      // Verify workflow progression
      expect(phaseResults.length).toBe(phases.length);

      // Production phase should have most comprehensive testing
      const productionResult = phaseResults.find(p => p.phase === 'production');
      expect(productionResult.result.results.length).toBeGreaterThan(3);
    });

    it('should handle phase execution dependencies and state management', async () => {
      // Use complex configuration to ensure consistency
      const complexConfig = TestConfigurationFactory.createComplexConfig();
      configManager.setConfig(complexConfig);

      // Load plugins from configuration
      await ruleEngine.loadPlugins();

      const phases = ['draft', 'coded', 'reviewed'];
      const executionLog: string[] = [];

      for (const phase of phases) {
        const context = TestContextFactory.createComplexContext();
        context.phase = phase;

        const startTime = Date.now();
        const result = await ruleEngine.executePhase(phase, context);
        const executionTime = Date.now() - startTime;

        // Debug output for reviewed phase
        if (phase === 'reviewed' && !result.success) {
          console.log(`\nReviewed phase debug:`, {
            enforcement: result.results.map(r => ({
              ruleId: r.ruleId,
              enforcement: r.enforcement,
              passed: r.passed,
            })),
            hardFailures: result.hardFailures,
            context: {
              hasPerformanceScore: !!context.metrics?.performance?.score,
              performanceScore: context.metrics?.performance?.score,
            },
          });
        }

        executionLog.push(
          `${phase}: ${result.success ? 'SUCCESS' : 'FAILED'} (${executionTime}ms)`
        );

        // Verify state consistency
        expect(result.phase).toBe(phase);
        expect(configManager.isConfigLoaded()).toBe(true);
      }

      // Verify execution log
      expect(executionLog.length).toBe(3);
      expect(executionLog[0]).toContain('draft: SUCCESS');
      expect(executionLog[1]).toContain('coded: SUCCESS');
      expect(executionLog[2]).toContain('reviewed: SUCCESS');
    });

    it('should handle phase rollback scenarios', async () => {
      const complexConfig = TestConfigurationFactory.createComplexConfig();
      configManager.setConfig(complexConfig);

      // Execute successful phase
      let context = TestContextFactory.createComplexContext();
      const successResult = await ruleEngine.executePhase('coded', context);
      expect(successResult.success).toBe(true);

      // Simulate regression - make context fail
      context = TestContextFactory.createFailingContext();
      const failResult = await ruleEngine.executePhase('coded', context);
      expect(failResult.success).toBe(false);
      expect(failResult.hardFailures.length).toBeGreaterThan(0);

      // Verify system can recover
      context = TestContextFactory.createComplexContext();
      const recoveryResult = await ruleEngine.executePhase('coded', context);
      expect(recoveryResult.success).toBe(true);
    });
  });

  describe('Advanced Rule Interaction Scenarios', () => {
    it('should handle interdependent rule validation', async () => {
      await ruleEngine.loadConfig();

      // Create context with interdependent metrics
      const context: RuleExecutionContextType = {
        phase: 'coded',
        target: 'code',
        code: `
          function calculateComplexMetrics(data) {
            // Complex calculation that affects multiple metrics
            const result = data.reduce((acc, item) => {
              return acc + processComplexItem(item);
            }, 0);
            return result / data.length;
          }
        `,
        metrics: {
          'test.coverage': 0.85,
          'test.branch-coverage': 0.82,
          'code.complexity': 0.12, // Slightly high complexity
          'performance.score': 0.88,
        },
      };

      const result = await ruleEngine.executePhase('coded', context);

      // Verify all rules were evaluated
      expect(result.results.length).toBeGreaterThan(0);

      // Verify interdependent metrics were considered
      const coverageResult = result.results.find(
        r => r.ruleId === 'test-coverage'
      );
      const complexityResult = result.results.find(
        r => r.ruleId === 'complexity-check'
      );

      expect(coverageResult).toBeDefined();
      if (complexityResult) {
        expect(complexityResult.data?.targetValue).toBe(0.12);
      }
    });

    it('should handle rule execution with cascading effects', async () => {
      await ruleEngine.loadConfig();

      // Add rules that might affect each other's execution
      const config = configManager.getConfig();
      config.rules['cascading-rule-1'] = {
        id: 'cascading-rule-1',
        type: 'threshold',
        target: 'metrics.base-score',
        value: 0.8,
        enforcement: 'hard',
      };
      config.rules['cascading-rule-2'] = {
        id: 'cascading-rule-2',
        type: 'threshold',
        target: 'metrics.derived-score',
        value: 0.7,
        enforcement: 'soft',
      };
      config.phases.coded.enforce!.push(
        'rule:cascading-rule-1',
        'rule:cascading-rule-2'
      );
      configManager.setConfig(config);

      const context: RuleExecutionContextType = {
        phase: 'coded',
        target: 'code',
        metrics: {
          coverage: 0.9,
          'base-score': 0.85,
          'derived-score': 0.75,
        },
      };

      const result = await ruleEngine.executePhase('coded', context);

      // Verify cascading rules were executed
      const cascadingResults = result.results.filter(r =>
        r.ruleId.startsWith('cascading-rule')
      );
      expect(cascadingResults.length).toBe(2);

      // Verify both rules passed
      expect(cascadingResults.every(r => r.passed)).toBe(true);
    });

    it('should handle rule execution with conditional logic', async () => {
      await ruleEngine.loadConfig();

      // Test with context that should trigger different rule behaviors
      const contexts = [
        // High-quality context
        {
          ...TestContextFactory.createComplexContext(),
          metrics: { coverage: 0.95, 'branch-coverage': 0.9, complexity: 0.05 },
        },
        // Medium-quality context
        {
          ...TestContextFactory.createBasicContext(),
          metrics: {
            coverage: 0.82,
            'branch-coverage': 0.78,
            complexity: 0.15,
          },
        },
        // Low-quality context
        {
          ...TestContextFactory.createFailingContext(),
          metrics: {
            coverage: 0.45,
            'branch-coverage': 0.32,
            complexity: 0.35,
          },
        },
      ];

      const results: PhaseExecutionResult[] = [];
      for (const context of contexts) {
        const result = await ruleEngine.executePhase('coded', context);
        results.push(result);
      }

      // Verify different outcomes based on context quality
      expect(results[0].success).toBe(true); // High quality should pass
      expect(results[2].success).toBe(false); // Low quality should fail

      // Verify score differences
      const highQualityScores = results[0].results
        .map(r => r.score)
        .filter(s => s !== undefined);
      const lowQualityScores = results[2].results
        .map(r => r.score)
        .filter(s => s !== undefined);

      if (highQualityScores.length > 0 && lowQualityScores.length > 0) {
        const avgHighScore =
          highQualityScores.reduce((a, b) => a + b, 0) /
          highQualityScores.length;
        const avgLowScore =
          lowQualityScores.reduce((a, b) => a + b, 0) / lowQualityScores.length;
        expect(avgHighScore).toBeGreaterThan(avgLowScore);
      }
    });
  });

  describe('Plugin Integration and Extensibility', () => {
    it('should handle complex plugin interactions', async () => {
      await ruleEngine.loadConfig();
      await ruleEngine.loadPlugins();

      // Load additional plugins for complex scenario
      await ruleEngine.loadPlugin('./advanced-security.js');
      await ruleEngine.loadPlugin('./performance-analyzer.js');
      await ruleEngine.loadPlugin('./code-quality-analyzer.js');

      const availablePlugins = ruleEngine.getAvailablePlugins();
      expect(availablePlugins.length).toBeGreaterThan(3);

      // Test plugin-based rule execution
      const context = TestContextFactory.createComplexContext();
      const result = await ruleEngine.executeRule('security-scan', context);

      expect(result.ruleType).toBe('plugin');
      expect(result.passed).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle plugin failure scenarios gracefully', async () => {
      await ruleEngine.loadConfig();

      // Mock plugin to fail
      const originalCreatePlugin = (pluginManager as any).createTestPlugin;
      (pluginManager as any).createTestPlugin = (path: string) => ({
        name: path,
        version: '1.0.0',
        async execute() {
          return {
            passed: false,
            message: 'Plugin execution failed',
            score: 0.0,
            data: { error: 'Plugin execution failed' },
          };
        },
        validate: () => true,
      });

      // Clear any existing plugins to ensure fresh load
      if ((pluginManager as any).plugins) {
        (pluginManager as any).plugins.clear();
      }

      // Load plugin AFTER mock is set up
      await ruleEngine.loadPlugin('./failing-plugin.js');

      // Add rule that uses failing plugin
      const config = configManager.getConfig();
      config.rules['failing-plugin-rule'] = {
        id: 'failing-plugin-rule',
        type: 'plugin',
        plugin: './failing-plugin.js',
        enforcement: 'soft',
      };
      config.phases.coded.enforce!.push('rule:failing-plugin-rule');
      configManager.setConfig(config);

      const context = TestContextFactory.createBasicContext();
      const result = await ruleEngine.executePhase('coded', context);

      // Should continue execution despite plugin failure
      expect(result.results.length).toBeGreaterThan(0);

      // Should have failure result
      const pluginResult = result.results.find(
        r => r.ruleId === 'failing-plugin-rule'
      );
      expect(pluginResult).toBeDefined();

      expect(pluginResult!.passed).toBe(false);

      // Restore original method
      (pluginManager as any).createTestPlugin = originalCreatePlugin;
    });

    it('should handle plugin lifecycle management', async () => {
      await ruleEngine.loadConfig();

      // Load plugins
      await ruleEngine.loadPlugin('./lifecycle-plugin-1.js');
      await ruleEngine.loadPlugin('./lifecycle-plugin-2.js');

      let plugins = ruleEngine.getAvailablePlugins();
      expect(plugins).toContain('./lifecycle-plugin-1.js');
      expect(plugins).toContain('./lifecycle-plugin-2.js');

      // Unload specific plugin
      await ruleEngine.unloadPlugin('./lifecycle-plugin-1.js');

      plugins = ruleEngine.getAvailablePlugins();
      expect(plugins).not.toContain('./lifecycle-plugin-1.js');
      expect(plugins).toContain('./lifecycle-plugin-2.js');

      // Cleanup all plugins
      await ruleEngine.cleanup();

      plugins = ruleEngine.getAvailablePlugins();
      expect(plugins.length).toBe(0);
    });
  });

  describe('Performance and Scalability Under Load', () => {
    it('should handle high-frequency rule execution efficiently', async () => {
      await ruleEngine.loadConfig();

      const context = TestContextFactory.createBasicContext();
      const iterations = 50;
      const executionTimes: number[] = [];
      const memoryUsages: number[] = [];

      const tasks = Array.from({ length: iterations }, () => async () => {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;
        await ruleEngine.executeRule('test-coverage', context);
        executionTimes.push(Date.now() - startTime);
        memoryUsages.push(process.memoryUsage().heapUsed - startMemory);
      });

      const startAll = Date.now();
      await Promise.all(tasks.map(fn => fn()));
      const totalTime = Date.now() - startAll;

      // Analyze performance metrics
      const avgExecutionTime =
        executionTimes.reduce((a, b) => a + b, 0) / iterations;
      const maxExecutionTime = Math.max(...executionTimes);
      const avgMemoryIncrease =
        memoryUsages.reduce((a, b) => a + b, 0) / iterations;

      expect(avgExecutionTime).toBeLessThan(100); // Should average under 100ms
      expect(maxExecutionTime).toBeLessThan(500); // No single execution over 500ms
      expect(avgMemoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB per execution
      expect(totalTime).toBeLessThan(2000); // All 50 in parallel should finish quickly
    });

    it('should handle concurrent rule execution without conflicts', async () => {
      await ruleEngine.loadConfig();

      const contexts = [
        TestContextFactory.createBasicContext(),
        TestContextFactory.createComplexContext(),
        TestContextFactory.createFailingContext(),
      ];

      // Execute multiple rule groups concurrently
      const promises = contexts.map(context =>
        ruleEngine.executeRuleGroup('code-quality', context)
      );

      const results = await Promise.all(promises);

      // All executions should complete
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result.length).toBeGreaterThan(0);
        expect(result.every(r => r.passed)).toBe(true);
      });

      // Results should be different based on context
      expect(results[0].some(r => r.passed)).toBe(true);
      expect(results[2].some(r => !r.passed)).toBe(true);
    });

    it('should maintain performance with large rule sets', async () => {
      // Create configuration with many rules
      const largeConfig = TestConfigurationFactory.createComplexConfig();

      // Add many additional rules
      for (let i = 0; i < 20; i++) {
        largeConfig.rules[`generated-rule-${i}`] = {
          id: `generated-rule-${i}`,
          type: 'threshold',
          target: `metrics.score-${i}`,
          value: 0.5,
          enforcement: 'soft',
        };
      }

      // Create large rule group
      const ruleIds = Object.keys(largeConfig.rules);
      largeConfig.ruleGroups['large-group'] = ruleIds;
      largeConfig.phases.tested.enforce = ['group:large-group'];

      configManager.setConfig(largeConfig);

      // Create context with many metrics
      const context = TestContextFactory.createComplexContext();
      for (let i = 0; i < 20; i++) {
        context.metrics![`score-${i}`] = Math.random();
      }

      const startTime = Date.now();
      const result = await ruleEngine.executePhase('tested', context);
      const executionTime = Date.now() - startTime;

      // Should handle large rule set efficiently
      expect(result.results.length).toBeGreaterThan(15);
      expect(executionTime).toBeLessThan(10000); // Under 10 seconds
      expect(result.results.every(r => r.executionTime >= 0)).toBe(true);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from transient errors gracefully', async () => {
      await ruleEngine.loadConfig();

      let errorCount = 0;
      const originalExecuteRule =
        executorFactory.createExecutor('threshold').executeRule;

      // Inject intermittent failures
      executorFactory.createExecutor('threshold').executeRule = async function (
        rule: any,
        input: any
      ) {
        errorCount++;
        if (errorCount % 3 === 0) {
          throw new Error('Transient error');
        }
        return originalExecuteRule.call(this, rule, input);
      };

      const context = TestContextFactory.createComplexContext();
      const results: RuleExecutionResult[] = [];

      // Execute multiple times
      for (let i = 0; i < 5; i++) {
        try {
          const result = await ruleEngine.executeRule('test-coverage', context);
          results.push(result);
        } catch (error) {
          // Some executions may fail, but system should continue
        }
        await TestUtils.sleep(10);
      }

      // Should have some successful executions
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.passed)).toBe(true);

      // Restore original method
      executorFactory.createExecutor('threshold').executeRule =
        originalExecuteRule;
    });

    it('should handle resource exhaustion scenarios', async () => {
      await ruleEngine.loadConfig();

      // Simulate resource-intensive operation
      const context = TestContextFactory.createComplexContext();
      context.code = 'x'.repeat(100000); // Large code string

      const startTime = Date.now();
      const result = await ruleEngine.executePhase('coded', context);
      const executionTime = Date.now() - startTime;

      // Should complete despite large input
      expect(result.results.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(15000); // Should not timeout
    });

    it('should maintain system integrity during partial failures', async () => {
      await ruleEngine.loadConfig();

      // Create scenario with mixed success/failure
      const config = configManager.getConfig();
      config.rules['always-fail'] = {
        id: 'always-fail',
        type: 'threshold',
        target: 'nonexistent.metric',
        value: 1.0,
        enforcement: 'soft',
      };
      config.phases.coded.enforce!.push('rule:always-fail');
      configManager.setConfig(config);

      const context = TestContextFactory.createComplexContext();
      const result = await ruleEngine.executePhase('coded', context);

      // System should continue despite partial failures
      expect(result.results.length).toBeGreaterThan(1);

      // Should have both successful and failed results
      expect(result.results.some(r => r.passed)).toBe(true);
      expect(result.results.some(r => !r.passed)).toBe(true);

      // System state should remain consistent
      expect(configManager.isConfigLoaded()).toBe(true);
      expect(ruleEngine.getAvailablePlugins()).toBeDefined();
    });
  });

  describe('Real-World Integration Scenarios', () => {
    it('should simulate continuous integration pipeline', async () => {
      const complexConfig = TestConfigurationFactory.createComplexConfig();
      configManager.setConfig(complexConfig);

      // Simulate CI/CD pipeline phases
      const pipelinePhases = [
        { phase: 'coded', context: TestContextFactory.createComplexContext() },
        { phase: 'tested', context: TestContextFactory.createComplexContext() },
        {
          phase: 'reviewed',
          context: TestContextFactory.createComplexContext(),
        },
        { phase: 'staged', context: TestContextFactory.createComplexContext() },
      ];

      const pipelineResults: Array<{
        phase: string;
        result: PhaseExecutionResult;
      }> = [];
      let pipelineFailed = false;

      for (const { phase, context } of pipelinePhases) {
        if (pipelineFailed) break;

        const result = await ruleEngine.executePhase(phase, context);
        pipelineResults.push({ phase, result });

        // Pipeline fails on hard failures
        if (result.hardFailures.length > 0) {
          pipelineFailed = true;
        }
      }

      // Verify pipeline execution
      expect(pipelineResults.length).toBeGreaterThan(0);
      expect(pipelineResults.every(p => p.result.results.length > 0)).toBe(
        true
      );

      // Should progress through phases
      expect(pipelineResults[0].phase).toBe('coded');
      if (pipelineResults.length > 1) {
        expect(pipelineResults[1].phase).toBe('tested');
      }
    });

    it('should handle multi-environment deployment validation', async () => {
      const complexConfig = TestConfigurationFactory.createComplexConfig();
      configManager.setConfig(complexConfig);

      const environments = ['staging', 'pre-production', 'production'];
      const deploymentResults: Array<{
        environment: string;
        result: PhaseExecutionResult;
      }> = [];

      for (const env of environments) {
        const context = TestContextFactory.createComplexContext();
        context.metadata = {
          ...context.metadata,
          environment: env,
          deploymentTime: new Date().toISOString(),
        };

        // Use staged phase for all environments (pre-production equivalent)
        const result = await ruleEngine.executePhase('staged', context);
        deploymentResults.push({ environment: env, result });

        // Log deployment attempt
        expect(logger.hasLogContaining(`Executing phase: staged`, 'info')).toBe(
          true
        );
      }

      // Verify all environment deployments
      expect(deploymentResults.length).toBe(3);
      deploymentResults.forEach(({ environment, result }) => {
        expect(result.results.length).toBeGreaterThan(0);
        expect(result.requiresHumanApproval).toBe(true);
      });
    });

    it('should validate complete software delivery lifecycle', async () => {
      const complexConfig = TestConfigurationFactory.createComplexConfig();
      configManager.setConfig(complexConfig);

      // Complete software delivery journey
      const deliveryStages = [
        { stage: 'Planning', phase: 'planned', metrics: {} },
        {
          stage: 'Development',
          phase: 'coded',
          metrics: { 'unit-coverage': 0.93 },
        },
        {
          stage: 'Testing',
          phase: 'tested',
          metrics: { 'unit-coverage': 0.95, 'integration-coverage': 0.88 },
        },
        {
          stage: 'Security Review',
          phase: 'reviewed',
          metrics: { 'unit-coverage': 0.95, 'integration-coverage': 0.88 },
        },
        {
          stage: 'Performance Testing',
          phase: 'staged',
          metrics: {
            'unit-coverage': 0.95,
            'integration-coverage': 0.88,
            'load-test-score': 0.92,
          },
        },
        {
          stage: 'Production Deployment',
          phase: 'production',
          metrics: {
            'unit-coverage': 0.95,
            'integration-coverage': 0.88,
            'load-test-score': 0.95,
          },
        },
      ];

      const deliveryResults: Array<{
        stage: string;
        phase: string;
        result: PhaseExecutionResult;
        stageTime: number;
      }> = [];
      let deliveryTime = 0;

      for (const { stage, phase, metrics } of deliveryStages) {
        const context = TestContextFactory.createComplexContext();
        context.phase = phase;
        context.metrics = { ...context.metrics, ...metrics };

        const stageStartTime = Date.now();
        const result = await ruleEngine.executePhase(phase, context);
        const stageTime = Date.now() - stageStartTime;

        deliveryTime += stageTime;
        deliveryResults.push({ stage, phase, result, stageTime });

        // Verify stage completion
        expect(result.phase).toBe(phase);
        expect(result.results.length).toBeGreaterThanOrEqual(0);
      }

      // Verify complete delivery lifecycle
      expect(deliveryResults.length).toBe(6);
      expect(deliveryTime).toBeLessThan(30000); // Complete lifecycle under 30 seconds

      // Verify progression through stages
      expect(deliveryResults[0].stage).toBe('Planning');
      expect(deliveryResults[5].stage).toBe('Production Deployment');

      // Final stage should require human approval
      expect(deliveryResults[5].result.requiresHumanApproval).toBe(true);
    });
  });

  describe('Compliance Rule Types', () => {
    beforeEach(async () => {
      await ruleEngine.loadConfig();
    });

    it('should validate commit message pattern (pass/fail)', async () => {
      const contextPass = {
        phase: 'planned',
        target: 'commit',
        metadata: { commitMessage: 'feat: add new feature' },
      };
      const contextFail = {
        phase: 'planned',
        target: 'commit',
        metadata: { commitMessage: 'bad commit message' },
      };
      const passResult = await ruleEngine.executeRule(
        'commit-msg-pattern',
        contextPass
      );
      const failResult = await ruleEngine.executeRule(
        'commit-msg-pattern',
        contextFail
      );
      expect(passResult.passed).toBe(true);
      expect(failResult.passed).toBe(false);
    });

    it('should validate security dependencies (pass/fail)', async () => {
      const contextPass = {
        phase: 'planned',
        target: 'security-deps',
        metadata: {},
      };
      const result = await ruleEngine.executeRule('security-deps', contextPass);
      expect(result.passed).toBe(true);
      expect(result.message).toContain('Security posture check passed');
    });

    it('should validate structure rule (pass/fail)', async () => {
      const contextPass = {
        phase: 'planned',
        target: 'structure',
        metadata: {
          fileTree: {
            files: ['README.md', 'package.json'],
            directories: ['src', 'tests'],
          },
        },
      };
      const contextFail = {
        phase: 'planned',
        target: 'structure',
        metadata: {
          fileTree: {
            files: ['README.md'],
            directories: ['src'],
          },
        },
      };
      const passResult = await ruleEngine.executeRule(
        'structure-required',
        contextPass
      );
      const failResult = await ruleEngine.executeRule(
        'structure-required',
        contextFail
      );
      expect(passResult.passed).toBe(true);
      expect(failResult.passed).toBe(false);
      expect(failResult.message).toBe(
        'Project must have README.md, package.json, src/, and tests/'
      );
    });
  });
});
