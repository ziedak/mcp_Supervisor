/**
 * Work Validator Implementation
 * Validates AI work output and detects hallucinations and quality issues
 * Following Single Responsibility and Dependency Inversion Principles
 */

import type { ILogger } from '../interfaces/ILogger';
import type { IWorkValidator } from '../interfaces/IWorkValidator';
import type {
  WorkValidationResultType,
  WorkValidationRequestType,
  EnrichmentContextType,
} from '../schemas/EnrichmentSchemas';
import { WorkValidationResultSchema } from '../schemas/EnrichmentSchemas';
import {
  WorkValidationError,
  HallucinationDetectedError,
} from '../errors/EnrichmentErrors';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../config/types';

/**
 * Work validator implementation
 */
@injectable()
export class WorkValidator implements IWorkValidator {
  private config = {
    qualityThresholds: {
      minimumQuality: 0.7,
      maximumHallucinationRisk: 0.3,
      minimumRelevance: 0.8,
    },
    enabledValidations: [
      'hallucination_detection',
      'completeness_check',
      'relevance_analysis',
      'quality_assessment',
      'common_issues',
      'standards_compliance',
    ],
    strictMode: false,
  };

  constructor(@inject(TYPES.Logger) private readonly logger: ILogger) {}

  async validateWork(
    request: WorkValidationRequestType
  ): Promise<WorkValidationResultType> {
    this.logger.debug('Validating work output', {
      workLength: request.work.length,
      phase: request.context.phase,
    });

    try {
      const issues: WorkValidationResultType['issues'] = [];
      const flags: string[] = [];

      // Run all validation checks
      const hallucinationResult = await this.detectHallucinations(
        request.work,
        request.context,
        request.originalPrompt
      );

      const completenessResult = await this.assessCompleteness(
        request.work,
        request.expectedOutcome || '',
        request.context
      );

      const relevanceResult = await this.calculateRelevance(
        request.work,
        request.originalPrompt,
        request.context
      );

      const qualityResult = await this.assessQuality(
        request.work,
        request.context
      );

      const commonIssuesResult = await this.detectCommonIssues(
        request.work,
        request.context
      );

      const standardsResult = await this.validateAgainstStandards(
        request.work,
        request.context
      );

      // Aggregate results
      if (
        hallucinationResult.hallucinationRisk >
        this.config.qualityThresholds.maximumHallucinationRisk
      ) {
        issues.push({
          type: 'hallucination',
          severity: 'critical',
          message: 'High risk of hallucinated content detected',
          suggestion: 'Review and verify all claims and statements',
        });
        flags.push('high_hallucination_risk');
      }

      if (completenessResult.completeness < 0.7) {
        issues.push({
          type: 'incomplete',
          severity: 'medium',
          message: 'Work appears incomplete',
          suggestion:
            'Address missing elements: ' +
            completenessResult.missingElements.join(', '),
        });
      }

      if (
        relevanceResult.relevanceScore <
        this.config.qualityThresholds.minimumRelevance
      ) {
        issues.push({
          type: 'irrelevant',
          severity: 'medium',
          message: 'Work contains irrelevant content',
          suggestion:
            'Focus on the specific requirements and remove unrelated content',
        });
      }

      // Add quality issues
      for (const qualityIssue of qualityResult.qualityIssues) {
        issues.push({
          type: 'error',
          severity: qualityIssue.severity,
          message: qualityIssue.message,
          location: qualityIssue.location,
          suggestion: qualityIssue.suggestion,
        });
      }

      // Add common issues
      for (const commonIssue of commonIssuesResult.issues) {
        issues.push({
          type: commonIssue.type as any,
          severity: commonIssue.severity,
          message: commonIssue.message,
          location: commonIssue.location,
          suggestion: commonIssue.autoFixable
            ? 'This issue can be automatically fixed'
            : undefined,
        });
      }

      flags.push(...commonIssuesResult.flags);

      // Calculate overall scores
      const overallQuality = Math.min(
        qualityResult.qualityScore,
        completenessResult.completeness,
        relevanceResult.relevanceScore
      );

      const isValid =
        issues.filter(
          (i: { severity: string }) =>
            i.severity === 'critical' || i.severity === 'high'
        ).length === 0;
      const isComplete = completenessResult.completeness > 0.9;

      const result: WorkValidationResultType = {
        isValid,
        isComplete,
        quality: overallQuality,
        hallucinationRisk: hallucinationResult.hallucinationRisk,
        relevanceScore: relevanceResult.relevanceScore,
        issues,
        flags,
      };

      return WorkValidationResultSchema.parse(result);
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Work validation failed: ${errorMessage}`);
      throw new WorkValidationError(
        `Work validation failed: ${error?.message || 'Unknown error'}`,
        [],
        { request }
      );
    }
  }

  async detectHallucinations(
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
  }> {
    const indicators: string[] = [];
    const details: any[] = [];
    let riskScore = 0;

    // Check for common hallucination patterns
    const hallucinationPatterns = [
      {
        pattern:
          /(?:I think|I believe|probably|might be|could be|seems like)/gi,
        type: 'uncertainty_expressions',
        severity: 'low' as const,
        weight: 0.1,
      },
      {
        pattern: /(?:obviously|clearly|definitely|certainly|without doubt)/gi,
        type: 'overconfidence_markers',
        severity: 'medium' as const,
        weight: 0.2,
      },
      {
        pattern:
          /(?:according to|research shows|studies indicate|experts say)/gi,
        type: 'unverified_claims',
        severity: 'high' as const,
        weight: 0.3,
      },
      {
        pattern: /(?:TODO|FIXME|placeholder|example|sample)/gi,
        type: 'placeholder_content',
        severity: 'medium' as const,
        weight: 0.25,
      },
    ];

    for (const { pattern, type, severity, weight } of hallucinationPatterns) {
      const matches = work.match(pattern);
      if (matches) {
        indicators.push(type);
        riskScore += matches.length * weight;

        details.push({
          location: 'content',
          type,
          severity,
          description: `Found ${matches.length} instances of ${type}`,
        });
      }
    }

    // Check for inconsistencies with prompt
    if (!this.isContentRelevantToPrompt(work, originalPrompt)) {
      indicators.push('prompt_inconsistency');
      riskScore += 0.4;
      details.push({
        location: 'overall',
        type: 'prompt_inconsistency',
        severity: 'high' as const,
        description: 'Content does not align with the original prompt',
      });
    }

    // Check for technical inaccuracies (basic patterns)
    const technicalPatterns = [
      /(?:this always works|never fails|100% guaranteed|perfect solution)/gi,
      /(?:just|simply|easy|trivial)\s+(?:add|change|modify|implement)/gi,
    ];

    for (const pattern of technicalPatterns) {
      const matches = work.match(pattern);
      if (matches) {
        indicators.push('technical_overconfidence');
        riskScore += matches.length * 0.2;
        details.push({
          location: 'content',
          type: 'technical_overconfidence',
          severity: 'medium' as const,
          description: 'Contains overconfident technical claims',
        });
      }
    }

    const hallucinationRisk = Math.min(1.0, riskScore);
    const confidence = 0.7; // Base confidence level for pattern matching

    return {
      hallucinationRisk,
      indicators,
      confidence,
      details,
    };
  }

  async assessCompleteness(
    work: string,
    expectedOutcome: string,
    context: EnrichmentContextType
  ): Promise<{
    completeness: number;
    missingElements: string[];
    suggestions: string[];
  }> {
    const missingElements: string[] = [];
    const suggestions: string[] = [];

    // Basic completeness checks
    if (work.length < 100) {
      missingElements.push('Insufficient content length');
      suggestions.push('Provide more detailed explanation or implementation');
    }

    // Check for code completeness (if applicable)
    if (context.phase === 'coded' || work.includes('```')) {
      if (work.includes('TODO') || work.includes('FIXME')) {
        missingElements.push('Incomplete code with TODO/FIXME markers');
        suggestions.push('Complete all TODO and FIXME items');
      }

      if (work.includes('function') && !work.includes('return')) {
        missingElements.push('Functions without return statements');
        suggestions.push('Ensure all functions have appropriate return values');
      }
    }

    // Check against expected outcome
    if (expectedOutcome) {
      const expectedKeywords = this.extractKeywords(expectedOutcome);
      const workKeywords = this.extractKeywords(work);

      const missingKeywords = expectedKeywords.filter(
        keyword => !workKeywords.includes(keyword)
      );

      if (missingKeywords.length > 0) {
        missingElements.push(
          `Missing expected elements: ${missingKeywords.join(', ')}`
        );
        suggestions.push('Address all aspects mentioned in the requirements');
      }
    }

    // Calculate completeness score
    let completeness = 1.0;
    completeness -= missingElements.length * 0.2;
    completeness = Math.max(0, completeness);

    return {
      completeness,
      missingElements,
      suggestions,
    };
  }

  async calculateRelevance(
    work: string,
    originalPrompt: string,
    context: EnrichmentContextType
  ): Promise<{
    relevanceScore: number;
    irrelevantSections: string[];
    alignmentIssues: string[];
  }> {
    const irrelevantSections: string[] = [];
    const alignmentIssues: string[] = [];

    // Extract key concepts from prompt
    const promptKeywords = this.extractKeywords(originalPrompt);
    const workKeywords = this.extractKeywords(work);

    // Calculate keyword overlap
    const commonKeywords = promptKeywords.filter(keyword =>
      workKeywords.includes(keyword)
    );

    const keywordRelevance =
      promptKeywords.length > 0
        ? commonKeywords.length / promptKeywords.length
        : 0.5;

    // Check for irrelevant content patterns
    const irrelevantPatterns = [
      /(?:by the way|incidentally|off topic|unrelated)/gi,
      /(?:this reminds me|speaking of which|while we're at it)/gi,
    ];

    for (const pattern of irrelevantPatterns) {
      const matches = work.match(pattern);
      if (matches) {
        irrelevantSections.push('Contains off-topic content');
      }
    }

    // Check alignment with context phase
    if (!this.isContentAlignedWithPhase(work, context.phase)) {
      alignmentIssues.push(`Content not aligned with ${context.phase} phase`);
    }

    let relevanceScore = keywordRelevance;
    relevanceScore -= irrelevantSections.length * 0.2;
    relevanceScore -= alignmentIssues.length * 0.3;
    relevanceScore = Math.max(0, Math.min(1, relevanceScore));

    return {
      relevanceScore,
      irrelevantSections,
      alignmentIssues,
    };
  }

  async assessQuality(
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
  }> {
    const qualityIssues: any[] = [];
    const improvements: string[] = [];

    let qualityScore = 1.0;

    // Check for basic quality issues
    if (work.includes('...') || work.includes('etc.')) {
      qualityIssues.push({
        type: 'completeness',
        severity: 'medium',
        message: 'Contains incomplete explanations (... or etc.)',
        suggestion: 'Provide complete explanations instead of using ellipsis',
      });
      qualityScore -= 0.1;
    }

    // Check for proper structure
    if (work.length > 500 && !work.includes('\n\n')) {
      qualityIssues.push({
        type: 'structure',
        severity: 'low',
        message: 'Long content without proper paragraph breaks',
        suggestion: 'Break content into readable paragraphs',
      });
      qualityScore -= 0.05;
    }

    // Check for code quality (if applicable)
    if (work.includes('```')) {
      if (work.includes('var ') && context.phase === 'coded') {
        qualityIssues.push({
          type: 'style',
          severity: 'low',
          message: 'Uses var instead of let/const',
          suggestion: 'Use let or const instead of var',
        });
        qualityScore -= 0.05;
      }

      if (work.includes('console.log') && !work.includes('debug')) {
        qualityIssues.push({
          type: 'style',
          severity: 'low',
          message: 'Contains debug console.log statements',
          suggestion: 'Remove debug statements or use proper logging',
        });
        qualityScore -= 0.05;
      }
    }

    // Generate improvement suggestions
    if (qualityScore < 0.8) {
      improvements.push('Review and improve overall content quality');
    }
    if (qualityIssues.length > 0) {
      improvements.push('Address the identified quality issues');
    }

    return {
      qualityScore: Math.max(0, qualityScore),
      qualityIssues,
      improvements,
    };
  }

  async detectCommonIssues(
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
  }> {
    const issues: any[] = [];
    const flags: string[] = [];

    // Check for incomplete code
    if (
      work.includes('// ... rest of implementation') ||
      work.includes('// TODO: implement')
    ) {
      issues.push({
        type: 'incomplete_code',
        severity: 'high',
        message: 'Contains incomplete code implementations',
        location: 'code blocks',
        autoFixable: false,
      });
      flags.push('incomplete_implementation');
    }

    // Check for placeholder text
    const placeholderPatterns = [
      /\[placeholder\]/gi,
      /\[insert.*?\]/gi,
      /\[your.*?\]/gi,
      /\[add.*?\]/gi,
    ];

    for (const pattern of placeholderPatterns) {
      if (pattern.test(work)) {
        issues.push({
          type: 'placeholder_text',
          severity: 'medium',
          message: 'Contains placeholder text that needs to be replaced',
          location: 'content',
          autoFixable: false,
        });
        flags.push('contains_placeholders');
        break;
      }
    }

    // Check for TODO comments
    if (
      work.includes('TODO') ||
      work.includes('FIXME') ||
      work.includes('XXX')
    ) {
      issues.push({
        type: 'todo_comments',
        severity: 'medium',
        message: 'Contains TODO/FIXME comments',
        location: 'comments',
        autoFixable: false,
      });
      flags.push('has_todos');
    }

    // Check for debug statements
    if (
      work.includes('console.log') ||
      work.includes('print(') ||
      work.includes('debug')
    ) {
      issues.push({
        type: 'debug_statements',
        severity: 'low',
        message: 'Contains debug statements',
        location: 'code',
        autoFixable: true,
      });
      flags.push('has_debug_statements');
    }

    // Check for hardcoded values
    const hardcodedPatterns = [
      /localhost:\d+/gi,
      /127\.0\.0\.1/gi,
      /(password|secret|key)\s*[:=]\s*["'][^"']+["']/gi,
    ];

    for (const pattern of hardcodedPatterns) {
      if (pattern.test(work)) {
        issues.push({
          type: 'hardcoded_values',
          severity: 'medium',
          message: 'Contains hardcoded values that should be configurable',
          location: 'code',
          autoFixable: false,
        });
        flags.push('has_hardcoded_values');
        break;
      }
    }

    return { issues, flags };
  }

  async validateAgainstStandards(
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
  }> {
    const violations: any[] = [];
    const recommendations: string[] = [];

    let complianceScore = 1.0;

    // Check code style standards (if applicable)
    if (work.includes('```')) {
      // Check for proper naming conventions
      if (/function [a-z]/.test(work)) {
        violations.push({
          standard: 'Naming Convention',
          violation: 'Function names should use camelCase',
          severity: 'low',
          suggestion: 'Use camelCase for function names (e.g., myFunction)',
        });
        complianceScore -= 0.05;
      }

      // Check for proper error handling
      if (work.includes('try') && !work.includes('catch')) {
        violations.push({
          standard: 'Error Handling',
          violation: 'Try blocks without catch statements',
          severity: 'medium',
          suggestion:
            'Always include proper error handling with try-catch blocks',
        });
        complianceScore -= 0.1;
      }
    }

    // Check documentation standards
    if (work.length > 500 && !work.includes('#') && !work.includes('/**')) {
      violations.push({
        standard: 'Documentation',
        violation: 'Lack of proper documentation or headers',
        severity: 'low',
        suggestion: 'Add headers and documentation to improve readability',
      });
      complianceScore -= 0.05;
    }

    // Generate recommendations
    if (violations.length > 0) {
      recommendations.push('Address the identified standards violations');
    }
    if (complianceScore < 0.8) {
      recommendations.push(
        'Review and improve compliance with coding standards'
      );
    }

    return {
      complianceScore: Math.max(0, complianceScore),
      violations,
      recommendations,
    };
  }

  async getValidationConfig(): Promise<{
    qualityThresholds: {
      minimumQuality: number;
      maximumHallucinationRisk: number;
      minimumRelevance: number;
    };
    enabledValidations: string[];
    strictMode: boolean;
  }> {
    return { ...this.config };
  }

  async updateValidationConfig(config: {
    qualityThresholds?: {
      minimumQuality?: number;
      maximumHallucinationRisk?: number;
      minimumRelevance?: number;
    };
    enabledValidations?: string[];
    strictMode?: boolean;
  }): Promise<void> {
    if (config.qualityThresholds) {
      this.config.qualityThresholds = {
        ...this.config.qualityThresholds,
        ...config.qualityThresholds,
      };
    }

    if (config.enabledValidations) {
      this.config.enabledValidations = config.enabledValidations;
    }

    if (config.strictMode !== undefined) {
      this.config.strictMode = config.strictMode;
    }

    this.logger.info('Work validation configuration updated');
  }

  // Helper methods
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - remove common words and get meaningful terms
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'this',
      'that',
      'these',
      'those',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 20); // Limit to top 20 keywords
  }

  private isContentRelevantToPrompt(work: string, prompt: string): boolean {
    const promptKeywords = this.extractKeywords(prompt);
    const workKeywords = this.extractKeywords(work);

    const overlap = promptKeywords.filter(keyword =>
      workKeywords.includes(keyword)
    );
    return (
      overlap.length >= Math.min(3, Math.floor(promptKeywords.length * 0.3))
    );
  }

  private isContentAlignedWithPhase(work: string, phase: string): boolean {
    const phaseKeywords: Record<string, string[]> = {
      draft: ['plan', 'draft', 'initial', 'outline'],
      planned: ['plan', 'strategy', 'approach', 'design'],
      coded: ['code', 'implement', 'function', 'class', 'method'],
      tested: ['test', 'spec', 'assert', 'expect', 'verify'],
      reviewed: ['review', 'feedback', 'analysis', 'evaluation'],
      production: ['deploy', 'release', 'production', 'live'],
    };

    const expectedKeywords = phaseKeywords[phase] || [];
    const workKeywords = this.extractKeywords(work);

    return expectedKeywords.some(keyword => workKeywords.includes(keyword));
  }
}
