/**
 * Work Validator Interface
 * Interface for validating AI work output and detecting issues
 * Following Interface Segregation Principle
 */

import type {
  WorkValidationResultType,
  WorkValidationRequestType,
  EnrichmentContextType,
} from '../schemas/EnrichmentSchemas';

/**
 * Work validator interface
 */
export interface IWorkValidator {
  /**
   * Validate complete work output
   */
  validateWork(
    request: WorkValidationRequestType
  ): Promise<WorkValidationResultType>;

  /**
   * Detect potential hallucinations in work output
   */
  detectHallucinations(
    work: string,
    context: EnrichmentContextType,
    originalPrompt: string
  ): Promise<{
    hallucinationRisk: number;
    indicators: string[];
    confidence: number;
    details: Array<{
      location: string;
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }>;
  }>;

  /**
   * Assess work completeness
   */
  assessCompleteness(
    work: string,
    expectedOutcome: string,
    context: EnrichmentContextType
  ): Promise<{
    completeness: number;
    missingElements: string[];
    suggestions: string[];
  }>;

  /**
   * Calculate relevance score
   */
  calculateRelevance(
    work: string,
    originalPrompt: string,
    context: EnrichmentContextType
  ): Promise<{
    relevanceScore: number;
    irrelevantSections: string[];
    alignmentIssues: string[];
  }>;

  /**
   * Validate work quality
   */
  assessQuality(
    work: string,
    context: EnrichmentContextType
  ): Promise<{
    qualityScore: number;
    qualityIssues: Array<{
      type: 'syntax' | 'logic' | 'style' | 'structure' | 'consistency';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      location?: string;
      suggestion?: string;
    }>;
    improvements: string[];
  }>;

  /**
   * Check for common issues
   */
  detectCommonIssues(
    work: string,
    context: EnrichmentContextType
  ): Promise<{
    issues: Array<{
      type:
        | 'incomplete_code'
        | 'placeholder_text'
        | 'todo_comments'
        | 'debug_statements'
        | 'hardcoded_values';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      location: string;
      autoFixable: boolean;
    }>;
    flags: string[];
  }>;

  /**
   * Validate against project standards
   */
  validateAgainstStandards(
    work: string,
    context: EnrichmentContextType
  ): Promise<{
    complianceScore: number;
    violations: Array<{
      standard: string;
      violation: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      suggestion: string;
    }>;
    recommendations: string[];
  }>;

  /**
   * Get validation configuration
   */
  getValidationConfig(): Promise<{
    qualityThresholds: {
      minimumQuality: number;
      maximumHallucinationRisk: number;
      minimumRelevance: number;
    };
    enabledValidations: string[];
    strictMode: boolean;
  }>;

  /**
   * Update validation configuration
   */
  updateValidationConfig(config: {
    qualityThresholds?: {
      minimumQuality?: number;
      maximumHallucinationRisk?: number;
      minimumRelevance?: number;
    };
    enabledValidations?: string[];
    strictMode?: boolean;
  }): Promise<void>;
}
