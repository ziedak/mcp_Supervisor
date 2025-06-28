import { SupervisorConfigType } from '../core/schemas/RuleEngineSchemas';

export const defaultConfig: SupervisorConfigType = {
  plan: {
    requiredSections: [
      'problem',
      'solution',
      'implementation',
      'testing',
      'risks',
    ],
  },
  phases: {
    draft: {
      enforce: [],
      requirePlan: false,
      requireHumanApproval: false,
    },
    planned: {
      enforce: ['plan-validation'],
      requirePlan: true,
      requireHumanApproval: false,
    },
    coded: {
      enforce: ['code-quality', 'test-coverage'],
      requirePlan: true,
      requireHumanApproval: false,
    },
    tested: {
      enforce: ['test-validation', 'code-quality'],
      requirePlan: true,
      requireHumanApproval: false,
    },
    reviewed: {
      enforce: ['review-checklist', 'security-scan'],
      requirePlan: true,
      requireHumanApproval: true,
    },
    production: {
      enforce: ['deployment-checklist', 'security-scan', 'performance-check'],
      requirePlan: true,
      requireHumanApproval: true,
    },
  },
  rules: {
    'plan-validation': {
      id: 'plan-validation',
      type: 'pattern',
      enforcement: 'hard',
      target: 'plan',
      pattern: '.*plan.*',
      message: 'A detailed plan is required for this phase',
    },
    'code-quality': {
      id: 'code-quality',
      type: 'threshold',
      enforcement: 'soft',
      target: 'code',
      value: 0.8,
      message: 'Code quality score must be above 80%',
    },
    'test-coverage': {
      id: 'test-coverage',
      type: 'threshold',
      enforcement: 'hard',
      target: 'tests',
      value: 0.8,
      message: 'Test coverage must be at least 80%',
    },
    'test-validation': {
      id: 'test-validation',
      type: 'pattern',
      enforcement: 'hard',
      target: 'tests',
      pattern: 'test.*pass',
      message: 'All tests must pass before proceeding',
    },
    'review-checklist': {
      id: 'review-checklist',
      type: 'pattern',
      enforcement: 'hard',
      target: 'review',
      pattern: 'review.*complete',
      message: 'Code review checklist must be completed',
    },
    'security-scan': {
      id: 'security-scan',
      type: 'threshold',
      enforcement: 'hard',
      target: 'security',
      value: 0.0,
      message: 'No security vulnerabilities allowed',
    },
    'deployment-checklist': {
      id: 'deployment-checklist',
      type: 'pattern',
      enforcement: 'hard',
      target: 'deployment',
      pattern: 'deploy.*ready',
      message: 'Deployment checklist must be completed',
    },
    'performance-check': {
      id: 'performance-check',
      type: 'threshold',
      enforcement: 'soft',
      target: 'performance',
      value: 0.8,
      message: 'Performance requirements should be met',
    },
  },
  ruleGroups: {
    'basic-validation': ['plan-validation', 'code-quality'],
    'security-validation': ['security-scan', 'review-checklist'],
  },
  extensions: {
    plugins: [],
  },
  defaults: {
    enforcement: 'hard',
  },
};
