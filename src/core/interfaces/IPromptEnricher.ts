/**
 * Prompt Enricher Interface
 * Main interface for prompt enrichment and MCP compliance
 * Following Single Responsibility and Interface Segregation Principles
 */

import type {
  PromptEnrichmentRequestType,
  EnrichedPromptType,
  WorkValidationRequestType,
  WorkValidationResultType,
  EnrichmentContextType,
  EnrichmentRuleType,
} from '../schemas/EnrichmentSchemas';

/**
 * Main prompt enricher interface
 */
export interface IPromptEnricher {
  /**
   * Enrich a prompt with plan requirements and context
   */
  enrichPrompt(
    request: PromptEnrichmentRequestType
  ): Promise<EnrichedPromptType>;

  /**
   * Validate work output before returning to user
   */
  validateWork(
    request: WorkValidationRequestType
  ): Promise<WorkValidationResultType>;

  /**
   * Check if enrichment rules should be enforced for given context
   */
  shouldEnforceRules(context: EnrichmentContextType): Promise<boolean>;

  /**
   * Get applicable enrichment rules for context
   */
  getApplicableRules(
    context: EnrichmentContextType
  ): Promise<EnrichmentRuleType[]>;

  /**
   * Intercept and process AI prompt before execution
   */
  interceptPrompt(
    prompt: string,
    context: EnrichmentContextType
  ): Promise<{
    processedPrompt: string;
    enrichments: string[];
    blocked: boolean;
    blockReason?: string;
    warnings: string[];
  }>;

  /**
   * Process AI response before returning to user
   */
  processResponse(
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
  }>;

  /**
   * Check if plan is required for current context
   */
  isPlanRequired(context: EnrichmentContextType): Promise<boolean>;

  /**
   * Get plan requirements for current context
   */
  getPlanRequirements(context: EnrichmentContextType): Promise<{
    required: boolean;
    sections: string[];
    templates: string[];
    guidelines: string[];
  }>;

  /**
   * Generate enrichment instructions for missing plan
   */
  generatePlanInstructions(
    context: EnrichmentContextType,
    missingSections: string[]
  ): Promise<string>;

  /**
   * Generate quality and compliance instructions
   */
  generateQualityInstructions(
    context: EnrichmentContextType,
    originalPrompt: string
  ): Promise<string>;

  /**
   * Initialize enricher with configuration
   */
  initialize(): Promise<void>;

  /**
   * Cleanup resources
   */
  cleanup(): Promise<void>;

  /**
   * Get enrichment statistics
   */
  getStatistics(): Promise<{
    totalPrompts: number;
    enrichedPrompts: number;
    blockedPrompts: number;
    qualityIssues: number;
    planEnforcements: number;
    hallucinationDetections: number;
  }>;

  /**
   * Reset statistics
   */
  resetStatistics(): Promise<void>;
}
