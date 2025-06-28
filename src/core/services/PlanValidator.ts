import { access } from 'fs/promises';
import { inject, injectable } from 'inversify';

import { join } from 'path';
import { PlanValidationError } from '../errors/EnrichmentErrors.js';
import type { ILogger } from '../interfaces/ILogger.js';
import {
  IPlanValidator,
  Plan,
  PlanValidationResult,
  PlanStep,
} from '../interfaces/IPlanValidator.js';
import {
  PlanType,
  EnrichmentContextType,
  PlanValidationResultType,
  PlanSchema,
  PlanValidationResultSchema,
} from '../schemas/EnrichmentSchemas.js';
import type { IConfigurationManager } from './ConfigurationManager.js';
import { TYPES } from '../../config/types.js';

/**
 * Implementation of the plan validator service
 * Enhanced with enrichment system support
 */
@injectable()
export class PlanValidator implements IPlanValidator {
  private validationRules: string[] = [
    'All steps must have valid names and descriptions',
    'Dependencies must exist within the plan',
    'No circular dependencies allowed',
    'Estimated durations must be positive',
    'High priority plans must have detailed steps',
  ];

  // private readonly logger?: ILogger;
  // private readonly configManager?: IConfigurationManager;

  constructor(
    @inject(TYPES.Logger) private readonly logger: ILogger,
    @inject(TYPES.ConfigurationManager)
    private readonly configManager: IConfigurationManager
  ) {}

  /**
   * Validate a complete plan
   */
  async validatePlan(plan: Plan): Promise<PlanValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic structure validation
    if (!plan.id || !plan.name || !plan.description) {
      errors.push('Plan must have id, name, and description');
    }

    if (!plan.steps || plan.steps.length === 0) {
      errors.push('Plan must have at least one step');
    }

    if (plan.estimatedDuration <= 0) {
      errors.push('Estimated duration must be positive');
    }

    // Validate each step
    for (const step of plan.steps) {
      const stepValidation = await this.validateStep(step);
      errors.push(...stepValidation.errors);
      warnings.push(...stepValidation.warnings);
      suggestions.push(...stepValidation.suggestions);
    }

    // Validate dependencies
    const depValidation = await this.validateDependencies(plan);
    errors.push(...depValidation.errors);
    warnings.push(...depValidation.warnings);

    // Validate feasibility
    const feasibilityValidation = await this.validateFeasibility(plan);
    warnings.push(...feasibilityValidation.warnings);
    suggestions.push(...feasibilityValidation.suggestions);

    // Calculate quality score
    const score = this.calculateQualityScore(plan, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score,
    };
  }

  /**
   * Validate a single plan step
   */
  async validateStep(step: PlanStep): Promise<PlanValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (!step.id || !step.name || !step.description) {
      errors.push(`Step must have id, name, and description`);
    }

    if (!step.action) {
      errors.push(`Step ${step.name} must have an action`);
    }

    if (step.expectedDuration <= 0) {
      errors.push(`Step ${step.name} expected duration must be positive`);
    }

    if (step.description.length < 10) {
      warnings.push(`Step ${step.name} description is too brief`);
    }

    if (!step.parameters || Object.keys(step.parameters).length === 0) {
      suggestions.push(
        `Consider adding parameters to step ${step.name} for better clarity`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score: errors.length === 0 ? (warnings.length === 0 ? 100 : 80) : 40,
    };
  }

  /**
   * Check plan dependencies
   */
  async validateDependencies(plan: Plan): Promise<PlanValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const stepIds = new Set(plan.steps.map(s => s.id));

    // Check plan-level dependencies
    for (const dep of plan.dependencies) {
      if (!dep || dep.trim() === '') {
        warnings.push('Empty dependency found in plan');
      }
    }

    // Check step dependencies
    for (const step of plan.steps) {
      for (const dep of step.dependencies) {
        if (!stepIds.has(dep)) {
          errors.push(`Step ${step.name} depends on non-existent step: ${dep}`);
        }
      }
    }

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(plan.steps);
    if (circularDeps.length > 0) {
      errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: [],
      score: errors.length === 0 ? 100 : 0,
    };
  }

  /**
   * Validate plan feasibility
   */
  async validateFeasibility(plan: Plan): Promise<PlanValidationResult> {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check if estimated duration matches sum of steps
    const totalStepDuration = plan.steps.reduce(
      (sum, step) => sum + step.expectedDuration,
      0
    );
    const difference = Math.abs(plan.estimatedDuration - totalStepDuration);

    if (difference > plan.estimatedDuration * 0.2) {
      warnings.push(
        'Plan estimated duration differs significantly from sum of step durations'
      );
    }

    // Check priority vs complexity
    if (plan.priority === 'high' && plan.steps.length < 3) {
      suggestions.push(
        'High priority plans typically benefit from more detailed breakdown'
      );
    }

    if (plan.priority === 'low' && plan.steps.length > 10) {
      suggestions.push('Consider simplifying low priority plans');
    }

    return {
      isValid: true,
      errors: [],
      warnings,
      suggestions,
      score: warnings.length === 0 ? 100 : 85,
    };
  }

  /**
   * Get validation rules
   */
  async getValidationRules(): Promise<string[]> {
    return [...this.validationRules];
  }

  /**
   * Update validation rules
   */
  async updateValidationRules(rules: string[]): Promise<void> {
    this.validationRules = [...rules];
  }

  /**
   * Calculate quality score for a plan
   */
  private calculateQualityScore(
    plan: Plan,
    errors: string[],
    warnings: string[]
  ): number {
    let score = 100;

    // Deduct points for errors
    score -= errors.length * 20;

    // Deduct points for warnings
    score -= warnings.length * 5;

    // Bonus points for good practices
    if (plan.description.length > 50) score += 5;
    if (plan.steps.length >= 3 && plan.steps.length <= 10) score += 5;
    if (plan.dependencies.length > 0) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detect circular dependencies in plan steps
   */
  private detectCircularDependencies(steps: PlanStep[]): string[] {
    const stepMap = new Map(steps.map(s => [s.id, s]));
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const circularDeps: string[] = [];

    const dfs = (stepId: string, path: string[]): void => {
      if (recursionStack.has(stepId)) {
        const cycleStart = path.indexOf(stepId);
        circularDeps.push(
          path.slice(cycleStart).join(' -> ') + ' -> ' + stepId
        );
        return;
      }

      if (visited.has(stepId)) return;

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = stepMap.get(stepId);
      if (step) {
        for (const dep of step.dependencies) {
          dfs(dep, [...path, stepId]);
        }
      }

      recursionStack.delete(stepId);
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        dfs(step.id, []);
      }
    }

    return circularDeps;
  }

  // Enhanced methods for enrichment system
  async validatePlanForEnrichment(
    plan: PlanType,
    requiredSections: string[],
    context: EnrichmentContextType
  ): Promise<PlanValidationResultType> {
    this.logger?.debug('Validating plan for enrichment', {
      phase: context.phase,
      requiredSections: requiredSections.length,
    });

    try {
      // Validate schema
      const validatedPlan = PlanSchema.parse(plan);

      const errors: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];
      const missingSections: string[] = [];
      const incompleteSections: string[] = [];

      // Check required sections
      for (const requiredSection of requiredSections) {
        const section = validatedPlan.sections.find(
          (s: any) => s.name === requiredSection
        );

        if (!section) {
          missingSections.push(requiredSection);
          errors.push(`Required section '${requiredSection}' is missing`);
        } else if (!section.content?.trim()) {
          incompleteSections.push(requiredSection);
          warnings.push(`Required section '${requiredSection}' is empty`);
        } else if (section.content.length < 50) {
          incompleteSections.push(requiredSection);
          warnings.push(
            `Section '${requiredSection}' appears incomplete (too short)`
          );
        }
      }

      // Validate individual sections
      for (const section of validatedPlan.sections) {
        if (section.required && !section.content?.trim()) {
          errors.push(`Required section '${section.name}' has no content`);
        }

        // Check for placeholder content
        if (
          section.content?.includes('TODO') ||
          section.content?.includes('TBD')
        ) {
          warnings.push(
            `Section '${section.name}' contains placeholder content`
          );
        }
      }

      // Calculate completion percentage
      const completionPercentage = this.calculateCompletionPercentage(
        validatedPlan,
        requiredSections
      );

      const result: PlanValidationResultType = {
        isValid: errors.length === 0,
        isComplete:
          missingSections.length === 0 && incompleteSections.length === 0,
        completionPercentage,
        missingSections,
        incompleteSections,
        errors,
        warnings,
        suggestions,
      };

      // Validate result schema
      return PlanValidationResultSchema.parse(result);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      this.logger?.error('Plan validation failed');
      throw new PlanValidationError(
        `Plan validation failed: ${errorMessage}`,
        [errorMessage],
        { context, requiredSections }
      );
    }
  }

  async planExists(context: EnrichmentContextType): Promise<boolean> {
    try {
      const planPath = join(context.workspaceRoot, '.supervisor', 'plan.md');
      await access(planPath);
      return true;
    } catch {
      // Try alternative locations
      const altPaths = ['PLAN.md', 'plan.md', 'docs/plan.md'];

      for (const altPath of altPaths) {
        try {
          await access(join(context.workspaceRoot, altPath));
          return true;
        } catch {
          continue;
        }
      }

      return false;
    }
  }

  async getRequiredSections(phase: string): Promise<string[]> {
    try {
      if (this.configManager && !this.configManager.isConfigLoaded()) {
        await this.configManager.loadConfig();
      }

      if (this.configManager) {
        const config = this.configManager.getConfig();
        const phaseConfig = config.phases[phase];

        if (phaseConfig?.requirePlan && config.plan?.requiredSections) {
          return config.plan.requiredSections;
        }
      }

      // Default required sections based on phase
      const defaultSections: Record<string, string[]> = {
        draft: [],
        planned: ['problem', 'solution', 'approach'],
        coded: ['problem', 'solution', 'implementation', 'testing'],
        tested: [
          'problem',
          'solution',
          'implementation',
          'testing',
          'validation',
        ],
        reviewed: [
          'problem',
          'solution',
          'implementation',
          'testing',
          'validation',
          'review',
        ],
        production: [
          'problem',
          'solution',
          'implementation',
          'testing',
          'validation',
          'review',
          'deployment',
        ],
      };

      return defaultSections[phase] || ['problem', 'solution'];
    } catch (error: any) {
      this.logger?.warn('Failed to get required sections, using defaults');
      return ['problem', 'solution'];
    }
  }

  async validateSection(
    sectionName: string,
    sectionContent: string,
    context: EnrichmentContextType
  ): Promise<{
    isValid: boolean;
    isComplete: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check content length
    if (!sectionContent?.trim()) {
      issues.push('Section is empty');
      return { isValid: false, isComplete: false, issues, suggestions };
    }

    if (sectionContent.length < 50) {
      issues.push('Section content is too short');
      suggestions.push('Provide more detailed information');
    }

    // Check for placeholder content
    const placeholders = ['TODO', 'TBD', 'FIXME', '[placeholder]'];
    for (const placeholder of placeholders) {
      if (sectionContent.includes(placeholder)) {
        issues.push(`Contains placeholder: ${placeholder}`);
        suggestions.push(`Replace ${placeholder} with actual content`);
      }
    }

    // Section-specific validation
    switch (sectionName.toLowerCase()) {
      case 'problem':
        if (
          !sectionContent.includes('?') &&
          !sectionContent.includes('issue') &&
          !sectionContent.includes('problem')
        ) {
          suggestions.push(
            'Clearly define the problem or issue being addressed'
          );
        }
        break;
      case 'solution':
        if (
          !sectionContent.includes('approach') &&
          !sectionContent.includes('solution') &&
          !sectionContent.includes('will')
        ) {
          suggestions.push('Describe the proposed solution approach');
        }
        break;
      case 'implementation':
        if (
          !sectionContent.includes('step') &&
          !sectionContent.includes('implement') &&
          sectionContent.length < 100
        ) {
          suggestions.push('Provide detailed implementation steps');
        }
        break;
    }

    const isValid = issues.length === 0;
    const isComplete = isValid && sectionContent.length >= 100;

    return { isValid, isComplete, issues, suggestions };
  }

  calculateCompletionPercentage(
    plan: PlanType,
    requiredSections: string[]
  ): number {
    if (requiredSections.length === 0) return 1.0;

    let completedSections = 0;

    for (const requiredSection of requiredSections) {
      const section = plan.sections.find(
        (s: any) => s.name === requiredSection
      );
      if (section?.content?.trim() && section.content.length >= 50) {
        completedSections++;
      }
    }

    return completedSections / requiredSections.length;
  }

  async assessPlanQuality(
    plan: PlanType,
    context: EnrichmentContextType
  ): Promise<{
    qualityScore: number;
    feedback: string[];
    improvements: string[];
  }> {
    const feedback: string[] = [];
    const improvements: string[] = [];

    let qualityPoints = 100;

    // Check overall structure
    if (plan.sections.length < 3) {
      qualityPoints -= 20;
      improvements.push('Add more comprehensive sections to the plan');
    }

    // Check content quality
    for (const section of plan.sections) {
      if (section.content.length < 100) {
        qualityPoints -= 10;
        improvements.push(`Expand section '${section.name}' with more detail`);
      }

      if (section.content.includes('TODO') || section.content.includes('TBD')) {
        qualityPoints -= 15;
        improvements.push(
          `Complete placeholder content in section '${section.name}'`
        );
      }
    }

    // Check for plan completeness
    const requiredSections = await this.getRequiredSections(context.phase);
    const missingCount = requiredSections.filter(
      req => !plan.sections.some((s: any) => s.name === req)
    ).length;

    qualityPoints -= missingCount * 25;

    if (missingCount > 0) {
      improvements.push(
        `Add missing required sections: ${requiredSections.join(', ')}`
      );
    }

    // Generate feedback
    if (qualityPoints >= 90) {
      feedback.push('Excellent plan quality with comprehensive coverage');
    } else if (qualityPoints >= 70) {
      feedback.push('Good plan quality with room for improvement');
    } else if (qualityPoints >= 50) {
      feedback.push('Plan needs significant improvement');
    } else {
      feedback.push('Plan requires major revision before proceeding');
    }

    return {
      qualityScore: Math.max(0, qualityPoints) / 100,
      feedback,
      improvements,
    };
  }
}
