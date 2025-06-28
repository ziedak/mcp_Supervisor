/** * Prompt Enricher Service * Main orchestrator for prompt enrichment and MCP compliance * Following Single Responsibility and Dependency Inversion Principles */ import {
  injectable,
  inject,
} from 'inversify';
import type { ILogger } from '../interfaces/ILogger';
import type { IPlanValidator } from '../interfaces/IPlanValidator';
import type { IWorkValidator } from '../interfaces/IWorkValidator';
import type { IPromptEnricher } from '../interfaces/IPromptEnricher';
import { TYPES } from '../../config/types';
import {
  PromptEnrichmentRequestSchema,
  type PromptEnrichmentRequestType,
  type EnrichedPromptType,
  type WorkValidationRequestType,
  type WorkValidationResultType,
  type EnrichmentContextType,
  type EnrichmentRuleType,
  EnrichmentConfigSchema,
  type EnrichmentConfigType,
} from '../schemas/EnrichmentSchemas';

import {
  EnrichmentError,
  PlanValidationError,
  WorkValidationError,
  EnrichmentConfigurationError,
} from '../errors/EnrichmentErrors';

/**
 * Statistics tracking interface
 */
interface EnrichmentStatistics {
  totalPrompts: number;
  enrichedPrompts: number;
  blockedPrompts: number;
  qualityIssues: number;
  planEnforcements: number;
  hallucinationDetections: number;
}

/**
 * Main prompt enricher service implementation
 */
@injectable()
export class PromptEnricher implements IPromptEnricher {
  private statistics: EnrichmentStatistics = {
    totalPrompts: 0,
    enrichedPrompts: 0,
    blockedPrompts: 0,
    qualityIssues: 0,
    planEnforcements: 0,
    hallucinationDetections: 0,
  };

  private configuration: EnrichmentConfigType | null = null;
  private isInitialized = false;

  constructor(
    @inject(TYPES.Logger) private readonly logger: ILogger,
    @inject(TYPES.PlanValidator) private readonly planValidator: IPlanValidator,
    @inject(TYPES.WorkValidator) private readonly workValidator: IWorkValidator
  ) {}

  /**
   * Initialize enricher with configuration
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing PromptEnricher service');

      // Load default configuration
      this.configuration = this.getDefaultConfiguration();

      // Validate configuration
      const validationResult = EnrichmentConfigSchema.safeParse(
        this.configuration
      );

      if (!validationResult.success) {
        throw new EnrichmentConfigurationError(
          'Invalid enrichment configuration',
          'CONFIG_VALIDATION_ERROR',
          { zodError: validationResult.error }
        );
      }

      this.isInitialized = true;
      this.logger.info('PromptEnricher service initialized successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to initialize PromptEnricher service: ${errorMessage}`
      );
      throw new EnrichmentError(
        'Enricher initialization failed',
        'INIT_ERROR',
        { cause: error }
      );
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      this.logger.info('Cleaning up PromptEnricher service');
      this.isInitialized = false;
      this.configuration = null;
      this.logger.info('PromptEnricher service cleanup completed');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error during PromptEnricher cleanup: ${errorMessage}`);
      throw new EnrichmentError('Enricher cleanup failed', 'CLEANUP_ERROR', {
        cause: error,
      });
    }
  }

  /**
   * Enrich a prompt with plan requirements and context
   */
  async enrichPrompt(
    request: PromptEnrichmentRequestType
  ): Promise<EnrichedPromptType> {
    this.ensureInitialized();

    try {
      // Validate request
      const validationResult = PromptEnrichmentRequestSchema.safeParse(request);
      if (!validationResult.success) {
        throw new EnrichmentError(
          'Invalid enrichment request',
          'VALIDATION_ERROR',
          { zodError: validationResult.error }
        );
      }

      this.statistics.totalPrompts++;

      const { originalPrompt, context, options } = request;

      // Check if enrichment should be enforced
      const shouldEnforce = await this.shouldEnforceRules(context);
      if (!shouldEnforce) {
        return {
          originalPrompt,
          enrichedPrompt: originalPrompt,
          enrichments: [],
          blocked: false,
          warnings: [],
          metadata: {
            processingTime: 0,
            rulesApplied: [],
            quality: { score: 1.0, issues: [] },
          },
        };
      }

      // Get applicable rules and check plan requirements
      const [applicableRules, planRequired] = await Promise.all([
        this.getApplicableRules(context),
        this.isPlanRequired(context),
      ]);

      let enrichments: string[] = [];
      let blocked = false;
      let blockReason: string | undefined;
      let warnings: string[] = [];

      // Handle plan validation if required
      if (planRequired) {
        try {
          // Create a minimal plan from the prompt
          const plan = {
            title: 'Ad-hoc Plan',
            description: originalPrompt,
            sections: [],
            metadata: { complexity: context.complexity || 1 },
          };

          const requirements = await this.getPlanRequirements(context);
          const planValidation =
            await this.planValidator.validatePlanForEnrichment(
              plan,
              requirements.sections,
              context
            );

          if (!planValidation.isValid) {
            this.statistics.planEnforcements++;

            if (options?.blockOnMissingPlan) {
              blocked = true;
              blockReason =
                'Plan validation failed: ' + planValidation.errors.join(', ');
            } else {
              // Generate plan instructions
              const planInstructions = await this.generatePlanInstructions(
                context,
                planValidation.missingSections || []
              );
              enrichments.push(planInstructions);
              warnings.push('Plan requirements not met - instructions added');
            }
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(`Plan validation failed: ${errorMessage}`);
          warnings.push('Plan validation error occurred');
        }
      }

      // Add quality and compliance instructions
      if (!blocked) {
        try {
          const qualityInstructions = await this.generateQualityInstructions(
            context,
            originalPrompt
          );
          enrichments.push(qualityInstructions);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Quality instruction generation failed: ${errorMessage}`
          );
          warnings.push('Quality instruction generation failed');
        }
      }

      // Build enriched prompt
      const enrichedPrompt = blocked
        ? originalPrompt
        : this.buildEnrichedPrompt(originalPrompt, enrichments);

      if (!blocked) {
        this.statistics.enrichedPrompts++;
      } else {
        this.statistics.blockedPrompts++;
      }

      return {
        originalPrompt,
        enrichedPrompt,
        enrichments,
        blocked,
        blockReason,
        warnings,
        metadata: {
          processingTime: Date.now(), // Simplified timing
          rulesApplied: applicableRules.map(rule => rule.id),
          quality: { score: blocked ? 0 : 1.0, issues: warnings },
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Prompt enrichment failed: ${errorMessage}`);
      throw new EnrichmentError('Failed to enrich prompt', 'ENRICHMENT_ERROR', {
        cause: error,
      });
    }
  }

  /**
   * Validate work output before returning to user
   */
  async validateWork(
    request: WorkValidationRequestType
  ): Promise<WorkValidationResultType> {
    this.ensureInitialized();

    try {
      // Delegate to work validator
      const result = await this.workValidator.validateWork(request);

      // Update statistics
      if (!result.isValid) {
        this.statistics.qualityIssues++;
      }

      if (result.containsHallucinations) {
        this.statistics.hallucinationDetections++;
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Work validation failed: ${errorMessage}`);
      throw new WorkValidationError('Failed to validate work output', [
        {
          type: 'VALIDATION_ERROR',
          severity: 'critical',
          message: errorMessage,
        },
      ]);
    }
  }

  /**
   * Check if enrichment rules should be enforced for given context
   */
  async shouldEnforceRules(context: EnrichmentContextType): Promise<boolean> {
    this.ensureInitialized();

    try {
      // Check if context matches enforcement criteria
      const config = this.configuration!;

      // Always enforce for development contexts
      if (context.projectType === 'development') {
        return true;
      }

      // Check complexity threshold
      if (
        context.complexity &&
        context.complexity >= config.complexityThreshold
      ) {
        return true;
      }

      // Check if any enforcement patterns match
      const patterns = config.enforcementPatterns || [];
      return patterns.some(
        (pattern: { type: string; value: string; enabled: boolean }) => {
          switch (pattern.type) {
            case 'project_type':
              return context.projectType === pattern.value;
            case 'task_type':
              return context.taskType === pattern.value;
            case 'user_role':
              return context.userRole === pattern.value;
            default:
              return false;
          }
        }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error checking rule enforcement: ${errorMessage}`);
      return false; // Fail safely
    }
  }

  /**
   * Get applicable enrichment rules for context
   */
  async getApplicableRules(
    context: EnrichmentContextType
  ): Promise<EnrichmentRuleType[]> {
    this.ensureInitialized();

    try {
      const config = this.configuration!;
      const allRules = config.rules || [];

      return allRules.filter((rule: EnrichmentRuleType) => {
        // Check if rule is enabled
        if (!rule.enabled) return false;

        // Check context conditions
        return rule.conditions.some(
          (condition: { field: string; operator: string; value: string }) => {
            switch (condition.field) {
              case 'projectType':
                return context.projectType === condition.value;
              case 'taskType':
                return context.taskType === condition.value;
              case 'userRole':
                return context.userRole === condition.value;
              case 'complexity':
                return (
                  context.complexity &&
                  context.complexity >= Number(condition.value)
                );
              default:
                return false;
            }
          }
        );
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting applicable rules: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Intercept and process AI prompt before execution
   */
  async interceptPrompt(
    prompt: string,
    context: EnrichmentContextType
  ): Promise<{
    processedPrompt: string;
    enrichments: string[];
    blocked: boolean;
    blockReason?: string;
    warnings: string[];
  }> {
    try {
      const enrichmentResult = await this.enrichPrompt({
        originalPrompt: prompt,
        context,
        options: { blockOnMissingPlan: true },
      });

      return {
        processedPrompt: enrichmentResult.enrichedPrompt,
        enrichments: enrichmentResult.enrichments,
        blocked: enrichmentResult.blocked,
        blockReason: enrichmentResult.blockReason,
        warnings: enrichmentResult.warnings,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Prompt interception failed: ${errorMessage}`);
      return {
        processedPrompt: prompt,
        enrichments: [],
        blocked: true,
        blockReason: 'Internal enrichment error',
        warnings: ['Prompt processing failed'],
      };
    }
  }

  /**
   * Process AI response before returning to user
   */
  async processResponse(
    response: string,
    originalPrompt: string,
    enrichedPrompt: string,
    context: EnrichmentContextType
  ): Promise<{
    processedResponse: string;
    blocked: boolean;
    blockReason?: string;
    warnings: string[];
    qualityScore: number;
    modifications: string[];
  }> {
    try {
      const validationResult = await this.validateWork({
        workOutput: response,
        originalPrompt,
        enrichedPrompt,
        context,
        requirements: {
          qualityThreshold: 0.7,
          checkHallucinations: true,
          checkCompleteness: true,
          checkRelevance: true,
          checkCompliance: true,
        },
      });

      let blocked = false;
      let blockReason: string | undefined;
      let modifications: string[] = [];

      // Block if validation fails critically
      if (
        !validationResult.isValid &&
        validationResult.severity === 'critical'
      ) {
        blocked = true;
        blockReason =
          'Critical validation failures: ' + validationResult.errors.join(', ');
      }

      // Block if hallucinations detected
      if (validationResult.containsHallucinations) {
        blocked = true;
        blockReason = 'Hallucinations detected in response';
      }

      return {
        processedResponse: blocked ? '' : response,
        blocked,
        blockReason,
        warnings: validationResult.warnings,
        qualityScore: validationResult.qualityScore,
        modifications,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Response processing failed: ${errorMessage}`);
      return {
        processedResponse: '',
        blocked: true,
        blockReason: 'Response validation failed',
        warnings: ['Response processing error'],
        qualityScore: 0,
        modifications: [],
      };
    }
  }

  /**
   * Check if plan is required for current context
   */
  async isPlanRequired(context: EnrichmentContextType): Promise<boolean> {
    this.ensureInitialized();

    try {
      const config = this.configuration!;

      // Check plan requirements
      const requirements = config.planRequirements;
      if (!requirements?.enabled) return false;

      // Check context-specific requirements
      return requirements.contexts.some(
        (ctx: { type: string; value: string }) => {
          switch (ctx.type) {
            case 'project_type':
              return context.projectType === ctx.value;
            case 'task_type':
              return context.taskType === ctx.value;
            case 'complexity':
              return (
                context.complexity && context.complexity >= Number(ctx.value)
              );
            default:
              return false;
          }
        }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error checking plan requirements: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Get plan requirements for current context
   */
  async getPlanRequirements(context: EnrichmentContextType): Promise<{
    required: boolean;
    sections: string[];
    templates: string[];
    guidelines: string[];
  }> {
    this.ensureInitialized();

    try {
      const config = this.configuration!;
      const requirements = config.planRequirements;

      if (!requirements?.enabled) {
        return {
          required: false,
          sections: [],
          templates: [],
          guidelines: [],
        };
      }

      return {
        required: await this.isPlanRequired(context),
        sections: requirements.requiredSections || [],
        templates: requirements.templates || [],
        guidelines: requirements.guidelines || [],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting plan requirements: ${errorMessage}`);
      return {
        required: false,
        sections: [],
        templates: [],
        guidelines: [],
      };
    }
  }

  /**
   * Generate enrichment instructions for missing plan
   */
  async generatePlanInstructions(
    context: EnrichmentContextType,
    missingSections: string[]
  ): Promise<string> {
    const instructions: string[] = [
      '🛡️ PLAN REQUIREMENT ENFORCEMENT:',
      '',
      'Before proceeding with implementation, you must provide a detailed plan that includes:',
    ];

    missingSections.forEach(section => {
      instructions.push(`- ${section}`);
    });

    instructions.push(
      '',
      'Your plan should follow these guidelines:',
      '- Break down the task into logical, testable units',
      '- Estimate complexity and time for each component',
      '- Identify dependencies and potential risks',
      '- Specify acceptance criteria and validation steps',
      '',
      'Please submit your plan first, then wait for approval before implementation.',
      ''
    );

    return instructions.join('\n');
  }

  /**
   * Generate quality and compliance instructions
   */
  async generateQualityInstructions(
    context: EnrichmentContextType,
    originalPrompt: string
  ): Promise<string> {
    const instructions: string[] = [
      '🎯 QUALITY & COMPLIANCE REQUIREMENTS:',
      '',
      'Your implementation must adhere to these standards:',
      '',
      '• Code Quality:',
      '  - Follow SOLID principles and clean architecture',
      '  - Write comprehensive tests and documentation',
      '  - Use TypeScript strict mode with explicit typing',
      '  - Follow existing project conventions and style',
      '',
      '• Validation Requirements:',
      '  - Validate all inputs using Zod schemas',
      '  - Handle errors gracefully with proper error types',
      '  - Implement proper logging and monitoring',
      '',
      '• Compliance Checks:',
      '  - No hallucinated or fabricated information',
      '  - All code must be tested and functional',
      '  - Follow security best practices',
      '  - Maintain backward compatibility where applicable',
      '',
      'Any response failing these requirements will be rejected.',
      '',
    ];

    return instructions.join('\n');
  }

  /**
   * Get enrichment statistics
   */
  async getStatistics(): Promise<EnrichmentStatistics> {
    return { ...this.statistics };
  }

  /**
   * Reset statistics
   */
  async resetStatistics(): Promise<void> {
    this.statistics = {
      totalPrompts: 0,
      enrichedPrompts: 0,
      blockedPrompts: 0,
      qualityIssues: 0,
      planEnforcements: 0,
      hallucinationDetections: 0,
    };
  }

  /**
   * Build enriched prompt by combining original with enrichments
   */
  private buildEnrichedPrompt(
    originalPrompt: string,
    enrichments: string[]
  ): string {
    if (enrichments.length === 0) {
      return originalPrompt;
    }

    const parts: string[] = [];

    // Add enrichment instructions first
    enrichments.forEach(enrichment => {
      parts.push(enrichment);
    });

    // Add separator
    parts.push('='.repeat(80));
    parts.push('ORIGINAL REQUEST:');
    parts.push('');

    // Add original prompt
    parts.push(originalPrompt);

    return parts.join('\n');
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.configuration) {
      throw new EnrichmentError(
        'PromptEnricher service not initialized',
        'NOT_INITIALIZED'
      );
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfiguration(): EnrichmentConfigType {
    return {
      enabled: true,
      enforcePlanRequirements: true,
      validateWorkOutput: true,
      hallucinationDetection: true,
      qualityThresholds: {
        minimumQuality: 0.7,
        maximumHallucinationRisk: 0.3,
        minimumRelevance: 0.8,
      },
      enrichmentTemplates: {
        planRequirement:
          '\n\nIMPORTANT: This task requires a comprehensive plan. Please ensure you have submitted a complete plan including: {sections}. If your plan is missing or incomplete, please provide it before proceeding with implementation.',
        qualityStandards:
          "\n\nQuality Standards: Ensure your response is accurate, complete, and directly addresses the request. Avoid speculation or hallucination. If you're uncertain about any aspect, clearly state your limitations.",
        contextReminder:
          "\n\nContext: You are working in phase '{phase}' of a supervised development process. Follow all established patterns and maintain consistency with existing code.",
      },
    };
  }
}
