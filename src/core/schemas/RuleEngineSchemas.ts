import z from 'zod';

/**
 * Zod schemas for validation following the .supervisorrc.json structure
 */

// Enforcement level schema
export const EnforcementLevelSchema = z.enum(['hard', 'soft']);

// Rule type schema
export const RuleTypeSchema = z.enum([
  'threshold',
  'pattern',
  'ai',
  'plugin',
  'commit-message', // NEW
  'security-posture', // NEW
  'structure', // NEW
]);

// Base supervisor rule schema
export const SupervisorRuleBaseSchema = z.object({
  id: z.string().min(1, 'Rule ID cannot be empty'),
  type: RuleTypeSchema,
  enforcement: EnforcementLevelSchema,
  target: z.string().optional(),
  message: z.string().optional(),
});

// Threshold rule schema
export const ThresholdRuleSchema = SupervisorRuleBaseSchema.extend({
  type: z.literal('threshold'),
  target: z.string().min(1, 'Target is required for threshold rules'),
  value: z.number().min(0).max(1, 'Threshold value must be between 0 and 1'),
});

// Pattern rule schema
export const PatternRuleSchema = SupervisorRuleBaseSchema.extend({
  type: z.literal('pattern'),
  pattern: z.string().min(1, 'Pattern is required for pattern rules'),
  target: z.string().min(1, 'Target is required for pattern rules'),
});

// AI rule schema
export const AIRuleSchema = SupervisorRuleBaseSchema.extend({
  type: z.literal('ai'),
  agent: z.string().min(1, 'Agent is required for AI rules'),
  strategy: z.enum(['analyze-and-instruct', 'refactor', 'validate']),
  instruction: z.string().min(1, 'Instruction is required for AI rules'),
  refactorAllowed: z.boolean().optional().default(false),
  target: z.string().min(1, 'Target is required for AI rules'),
});

// Plugin rule schema
export const PluginRuleSchema = SupervisorRuleBaseSchema.extend({
  type: z.literal('plugin'),
  plugin: z.string().min(1, 'Plugin path is required for plugin rules'),
});

// Commit message rule schema
export const CommitMessageRuleSchema = SupervisorRuleBaseSchema.extend({
  type: z.literal('commit-message'),
  pattern: z.string().min(1, 'Pattern is required for commit message rules'),
  message: z.string().optional(),
});

// Security posture rule schema
export const SecurityPostureRuleSchema = SupervisorRuleBaseSchema.extend({
  type: z.literal('security-posture'),
  check: z.string().min(1, 'Check type is required for security posture rules'),
  message: z.string().optional(),
});

// Structure rule schema
export const StructureRuleSchema = SupervisorRuleBaseSchema.extend({
  type: z.literal('structure'),
  requiredFiles: z.array(z.string().min(1)),
  requiredDirectories: z.array(z.string().min(1)).optional(),
  message: z.string().optional(),
});

// Discriminated union for all supervisor rules
export const SupervisorRuleSchema = z.discriminatedUnion('type', [
  ThresholdRuleSchema,
  PatternRuleSchema,
  AIRuleSchema,
  PluginRuleSchema,
  CommitMessageRuleSchema, // NEW
  SecurityPostureRuleSchema, // NEW
  StructureRuleSchema, // NEW
]);

// Phase configuration schema
export const PhaseConfigSchema = z.object({
  enforce: z.array(z.string()).optional(),
  requirePlan: z.boolean().optional().default(false),
  requireHumanApproval: z.boolean().optional().default(false),
});

// Plan configuration schema
export const PlanConfigSchema = z.object({
  requiredSections: z
    .array(z.string().min(1))
    .min(1, 'At least one required section must be specified'),
});

// Extensions configuration schema
export const ExtensionsConfigSchema = z.object({
  plugins: z.array(z.string().min(1)),
});

// Defaults configuration schema
export const DefaultsConfigSchema = z.object({
  enforcement: EnforcementLevelSchema,
});

// Complete supervisor configuration schema
export const SupervisorConfigSchema = z.object({
  plan: PlanConfigSchema,
  phases: z.record(z.string(), PhaseConfigSchema),
  rules: z.record(z.string(), SupervisorRuleSchema),
  ruleGroups: z.record(z.string(), z.array(z.string().min(1))),
  extensions: ExtensionsConfigSchema,
  defaults: DefaultsConfigSchema,
});

// Rule execution context schema
export const RuleExecutionContextSchema = z.object({
  phase: z.string().min(1),
  target: z.string().min(1),
  code: z.string().optional(),
  metrics: z.record(z.string(), z.number()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Legacy rule schema (for backwards compatibility)
export const LegacyRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  condition: z.string().min(1),
  action: z.string().min(1),
  priority: z.number().min(0).max(100),
  enabled: z.boolean(),
});

// Rule result schema
export const RuleResultSchema = z.object({
  passed: z.boolean(),
  message: z.string().optional(),
  score: z.number().min(0).max(1).optional(),
  data: z.record(z.unknown()).optional(),
});

// Rule execution result schema (for rule engine execution)
export const RuleExecutionResultSchema = z.object({
  ruleId: z.string(),
  ruleType: z.string(),
  enforcement: z.string(),
  passed: z.boolean(),
  message: z.string().optional(),
  score: z.number().min(0).max(1).optional(),
  executionTime: z.number(),
  data: z.record(z.unknown()).optional(),
});

// Plugin config schema - flexible structure for plugin configuration
export const PluginConfigSchema = z.record(z.unknown());

// Type exports for use in other files
export type SupervisorConfigType = z.infer<typeof SupervisorConfigSchema>;
export type SupervisorRuleType = z.infer<typeof SupervisorRuleSchema>;
export type ThresholdRuleType = z.infer<typeof ThresholdRuleSchema>;
export type PatternRuleType = z.infer<typeof PatternRuleSchema>;
export type AIRuleType = z.infer<typeof AIRuleSchema>;
export type PluginRuleType = z.infer<typeof PluginRuleSchema>;
export type CommitMessageRuleType = z.infer<typeof CommitMessageRuleSchema>;
export type SecurityPostureRuleType = z.infer<typeof SecurityPostureRuleSchema>;
export type StructureRuleType = z.infer<typeof StructureRuleSchema>;
export type PhaseConfigType = z.infer<typeof PhaseConfigSchema>;
export type RuleExecutionContextType = z.infer<
  typeof RuleExecutionContextSchema
>;
export type RuleExecutionResultType = z.infer<typeof RuleExecutionResultSchema>;
export type LegacyRuleType = z.infer<typeof LegacyRuleSchema>;
export type RuleResultType = z.infer<typeof RuleResultSchema>;
export type PluginConfigType = z.infer<typeof PluginConfigSchema>;

// Convenience type aliases for cleaner imports
export type RuleExecutionContext = RuleExecutionContextType;
export type RuleExecutionResult = RuleExecutionResultType;
