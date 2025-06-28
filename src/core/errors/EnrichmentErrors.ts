/**
 * Enrichment Error Types
 * Custom errors for prompt enrichment and validation
 * Following error handling best practices
 */

/**
 * Base enrichment error
 */
export class EnrichmentError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'ENRICHMENT_ERROR',
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EnrichmentError';
  }
}

/**
 * Plan validation error
 */
export class PlanValidationError extends EnrichmentError {
  constructor(
    message: string,
    public readonly validationErrors: string[],
    context?: Record<string, unknown>
  ) {
    super(message, 'PLAN_VALIDATION_ERROR', context);
    this.name = 'PlanValidationError';
  }
}

/**
 * Plan requirement error - when plan is required but missing/incomplete
 */
export class PlanRequirementError extends EnrichmentError {
  constructor(
    message: string,
    public readonly requiredSections: string[],
    public readonly missingSections: string[],
    context?: Record<string, unknown>
  ) {
    super(message, 'PLAN_REQUIREMENT_ERROR', context);
    this.name = 'PlanRequirementError';
  }
}

/**
 * Work validation error - when AI output fails validation
 */
export class WorkValidationError extends EnrichmentError {
  constructor(
    message: string,
    public readonly validationIssues: Array<{
      type: string;
      severity: string;
      message: string;
      location?: string;
    }>,
    context?: Record<string, unknown>
  ) {
    super(message, 'WORK_VALIDATION_ERROR', context);
    this.name = 'WorkValidationError';
  }
}

/**
 * Hallucination detection error - when content appears to be hallucinated
 */
export class HallucinationDetectedError extends EnrichmentError {
  constructor(
    message: string,
    public readonly confidence: number,
    public readonly indicators: string[],
    context?: Record<string, unknown>
  ) {
    super(message, 'HALLUCINATION_DETECTED', context);
    this.name = 'HallucinationDetectedError';
  }
}

/**
 * Enrichment configuration error
 */
export class EnrichmentConfigurationError extends EnrichmentError {
  constructor(
    message: string,
    public readonly configPath?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'ENRICHMENT_CONFIG_ERROR', context);
    this.name = 'EnrichmentConfigurationError';
  }
}

/**
 * Prompt enrichment error - when enrichment process fails
 */
export class PromptEnrichmentError extends EnrichmentError {
  constructor(
    message: string,
    public readonly originalPrompt: string,
    public readonly enrichmentStage: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'PROMPT_ENRICHMENT_ERROR', context);
    this.name = 'PromptEnrichmentError';
  }
}

/**
 * Rule evaluation error - when enrichment rules fail to evaluate
 */
export class RuleEvaluationError extends EnrichmentError {
  constructor(
    message: string,
    public readonly ruleId: string,
    public readonly evaluationContext: Record<string, unknown>,
    context?: Record<string, unknown>
  ) {
    super(message, 'RULE_EVALUATION_ERROR', context);
    this.name = 'RuleEvaluationError';
  }
}
