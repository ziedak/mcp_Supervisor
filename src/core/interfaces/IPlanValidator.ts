/**
 * Plan Validator Interface
 * Enhanced interface for plan validation with enrichment support
 * Following Interface Segregation Principle
 */

import type {
  PlanType,
  PlanValidationResultType,
  EnrichmentContextType,
} from '../schemas/EnrichmentSchemas';

/**
 * Legacy plan data structure (maintained for backward compatibility)
 */
export interface Plan {
  id: string;
  name: string;
  description: string;
  steps: PlanStep[];
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  status: 'draft' | 'validated' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual step in a plan
 */
export interface PlanStep {
  id: string;
  name: string;
  description: string;
  action: string;
  parameters?: Record<string, any>;
  expectedDuration: number;
  dependencies: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

/**
 * Legacy validation result (maintained for backward compatibility)
 */
export interface PlanValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score: number; // 0-100 quality score
}

/**
 * Enhanced Plan validator interface with enrichment support
 */
export interface IPlanValidator {
  // Legacy methods (maintained for backward compatibility)
  /**
   * Validate a complete plan (legacy)
   */
  validatePlan(plan: Plan): Promise<PlanValidationResult>;

  /**
   * Validate a single plan step (legacy)
   */
  validateStep(step: PlanStep): Promise<PlanValidationResult>;

  /**
   * Check plan dependencies (legacy)
   */
  validateDependencies(plan: Plan): Promise<PlanValidationResult>;

  /**
   * Validate plan feasibility (legacy)
   */
  validateFeasibility(plan: Plan): Promise<PlanValidationResult>;

  /**
   * Get validation rules (legacy)
   */
  getValidationRules(): Promise<string[]>;

  /**
   * Update validation rules (legacy)
   */
  updateValidationRules(rules: string[]): Promise<void>;

  // Enhanced methods for enrichment system
  /**
   * Validate plan completeness and structure for enrichment
   */
  validatePlanForEnrichment(
    plan: PlanType,
    requiredSections: string[],
    context: EnrichmentContextType
  ): Promise<PlanValidationResultType>;

  /**
   * Check if plan exists and is accessible
   */
  planExists(context: EnrichmentContextType): Promise<boolean>;

  /**
   * Get required plan sections for a given phase
   */
  getRequiredSections(phase: string): Promise<string[]>;

  /**
   * Validate individual plan section
   */
  validateSection(
    sectionName: string,
    sectionContent: string,
    context: EnrichmentContextType
  ): Promise<{
    isValid: boolean;
    isComplete: boolean;
    issues: string[];
    suggestions: string[];
  }>;

  /**
   * Calculate plan completion percentage
   */
  calculateCompletionPercentage(
    plan: PlanType,
    requiredSections: string[]
  ): number;

  /**
   * Get plan quality score
   */
  assessPlanQuality(
    plan: PlanType,
    context: EnrichmentContextType
  ): Promise<{
    qualityScore: number;
    feedback: string[];
    improvements: string[];
  }>;
}
