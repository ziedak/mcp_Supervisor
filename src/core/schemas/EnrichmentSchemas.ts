/**
 * Enrichment Schemas
 * Zod schemas for prompt enrichment and validation
 * Following strict typing and validation principles
 */

import z from 'zod';

// Base enrichment context schema
export const EnrichmentContextSchema = z.object({
  phase: z.string(),
  workspaceRoot: z.string(),
  currentFile: z.string().optional(),
  userIntent: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Plan structure schema
export const PlanSectionSchema = z.object({
  name: z.string(),
  content: z.string(),
  completed: z.boolean().default(false),
  required: z.boolean().default(true),
});

export const PlanSchema = z.object({
  sections: z.array(PlanSectionSchema),
  lastUpdated: z.string().optional(),
  version: z.number().default(1),
  metadata: z.record(z.unknown()).optional(),
});

// Plan validation result schema
export const PlanValidationResultSchema = z.object({
  isValid: z.boolean(),
  isComplete: z.boolean(),
  completionPercentage: z.number().min(0).max(1),
  missingSections: z.array(z.string()),
  incompleteSections: z.array(z.string()),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
});

// Work validation result schema
export const WorkValidationResultSchema = z.object({
  isValid: z.boolean(),
  isComplete: z.boolean(),
  quality: z.number().min(0).max(1),
  hallucinationRisk: z.number().min(0).max(1),
  relevanceScore: z.number().min(0).max(1),
  issues: z.array(
    z.object({
      type: z.enum(['hallucination', 'incomplete', 'irrelevant', 'error']),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      message: z.string(),
      location: z.string().optional(),
      suggestion: z.string().optional(),
    })
  ),
  flags: z.array(z.string()),
});

// Prompt enrichment request schema
export const PromptEnrichmentRequestSchema = z.object({
  originalPrompt: z.string(),
  context: EnrichmentContextSchema,
  plan: PlanSchema.optional(),
  enforceRules: z.boolean().default(true),
  enrichmentLevel: z
    .enum(['minimal', 'standard', 'comprehensive'])
    .default('standard'),
});

// Enriched prompt schema
export const EnrichedPromptSchema = z.object({
  enrichedPrompt: z.string(),
  originalPrompt: z.string(),
  enrichments: z.array(
    z.object({
      type: z.enum([
        'plan_requirement',
        'context_addition',
        'constraint_addition',
        'quality_instruction',
      ]),
      content: z.string(),
      reason: z.string(),
    })
  ),
  planValidation: PlanValidationResultSchema.optional(),
  requiresPlan: z.boolean(),
  planRequirements: z.array(z.string()).optional(),
});

// Work validation request schema
export const WorkValidationRequestSchema = z.object({
  work: z.string(),
  context: EnrichmentContextSchema,
  originalPrompt: z.string(),
  enrichedPrompt: z.string().optional(),
  expectedOutcome: z.string().optional(),
});

// Enrichment configuration schema
export const EnrichmentConfigSchema = z.object({
  enabled: z.boolean().default(true),
  enforcePlanRequirements: z.boolean().default(true),
  validateWorkOutput: z.boolean().default(true),
  hallucinationDetection: z.boolean().default(true),
  qualityThresholds: z.object({
    minimumQuality: z.number().min(0).max(1).default(0.7),
    maximumHallucinationRisk: z.number().min(0).max(1).default(0.3),
    minimumRelevance: z.number().min(0).max(1).default(0.8),
  }),
  enrichmentTemplates: z.object({
    planRequirement: z
      .string()
      .default(
        '\n\nIMPORTANT: This task requires a comprehensive plan. Please ensure you have submitted a complete plan including: {sections}. If your plan is missing or incomplete, please provide it before proceeding with implementation.'
      ),
    qualityStandards: z
      .string()
      .default(
        "\n\nQuality Standards: Ensure your response is accurate, complete, and directly addresses the request. Avoid speculation or hallucination. If you're uncertain about any aspect, clearly state your limitations."
      ),
    contextReminder: z
      .string()
      .default(
        "\n\nContext: You are working in phase '{phase}' of a supervised development process. Follow all established patterns and maintain consistency with existing code."
      ),
  }),
});

// Enrichment rule schema
export const EnrichmentRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  phases: z.array(z.string()).optional(), // If undefined, applies to all phases
  conditions: z.object({
    requiresPlan: z.boolean().default(false),
    planSectionsRequired: z.array(z.string()).optional(),
    filePatterns: z.array(z.string()).optional(),
    userIntentPatterns: z.array(z.string()).optional(),
  }),
  actions: z.object({
    enrichPrompt: z.boolean().default(false),
    validatePlan: z.boolean().default(false),
    validateWork: z.boolean().default(false),
    rejectIncomplete: z.boolean().default(false),
  }),
  priority: z.number().default(50),
  enabled: z.boolean().default(true),
});

// Type exports
export type EnrichmentContextType = z.infer<typeof EnrichmentContextSchema>;
export type PlanSectionType = z.infer<typeof PlanSectionSchema>;
export type PlanType = z.infer<typeof PlanSchema>;
export type PlanValidationResultType = z.infer<
  typeof PlanValidationResultSchema
>;
export type WorkValidationResultType = z.infer<
  typeof WorkValidationResultSchema
>;
export type PromptEnrichmentRequestType = z.infer<
  typeof PromptEnrichmentRequestSchema
>;
export type EnrichedPromptType = z.infer<typeof EnrichedPromptSchema>;
export type WorkValidationRequestType = z.infer<
  typeof WorkValidationRequestSchema
>;
export type EnrichmentConfigType = z.infer<typeof EnrichmentConfigSchema>;
export type EnrichmentRuleType = z.infer<typeof EnrichmentRuleSchema>;
