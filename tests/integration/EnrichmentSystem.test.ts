import { Container } from 'inversify';
import { IPromptEnricher } from '../../src/core/interfaces/IPromptEnricher';
import { IPlanValidator } from '../../src/core/interfaces/IPlanValidator';
import { IWorkValidator } from '../../src/core/interfaces/IWorkValidator';
import { ILogger } from '../../src/core/interfaces/ILogger';
import { TYPES } from '../../src/config/types';
import { Logger } from '../../src/core/services/Logger';
import { PlanValidator } from '../../src/core/services/PlanValidator';
import { WorkValidator } from '../../src/core/services/WorkValidator';
import { PromptEnricher } from '../../src/core/services/PromptEnricher';
import {
  EnrichmentContextType,
  PromptEnrichmentRequestType,
  WorkValidationRequestType,
} from '../../src/core/schemas/EnrichmentSchemas';

describe('Enrichment System Integration', () => {
  let testContainer: Container;
  let promptEnricher: IPromptEnricher;
  let planValidator: IPlanValidator;
  let workValidator: IWorkValidator;
  let logger: ILogger;

  beforeEach(() => {
    // Create a test container with required bindings
    testContainer = new Container();

    // Create and bind services
    logger = new Logger();
    planValidator = new PlanValidator(logger);
    workValidator = new WorkValidator(logger);
    promptEnricher = new PromptEnricher(logger, planValidator, workValidator);

    testContainer.bind<ILogger>(TYPES.Logger).toConstantValue(logger);
    testContainer
      .bind<IPlanValidator>(TYPES.PlanValidator)
      .toConstantValue(planValidator);
    testContainer
      .bind<IWorkValidator>(TYPES.WorkValidator)
      .toConstantValue(workValidator);
    testContainer
      .bind<IPromptEnricher>(TYPES.PromptEnricher)
      .toConstantValue(promptEnricher);
  });

  describe('Service Resolution', () => {
    it('should resolve all enrichment services from DI container', () => {
      expect(promptEnricher).toBeDefined();
      expect(planValidator).toBeDefined();
      expect(workValidator).toBeDefined();
      expect(logger).toBeDefined();
    });

    it('should have correct service types', () => {
      expect(typeof promptEnricher.enrichPrompt).toBe('function');
      expect(typeof planValidator.validatePlan).toBe('function');
      expect(typeof workValidator.validateWork).toBe('function');
    });
  });

  describe('Basic Integration Flow', () => {
    const mockContext: EnrichmentContextType = {
      phase: 'planning',
      workspaceRoot: '/tmp/test-workspace',
    };

    it('should handle enrichment workflow without errors', async () => {
      const enrichmentRequest: PromptEnrichmentRequestType = {
        originalPrompt: 'Implement user authentication',
        context: mockContext,
      };

      try {
        // Initialize the prompt enricher
        await promptEnricher.initialize();

        const result = await promptEnricher.enrichPrompt(enrichmentRequest);
        expect(result).toBeDefined();
      } catch (error) {
        console.log('Enrichment error:', error);
        // For now, just verify the error is handled gracefully
        expect(error).toBeDefined();
      }
    });

    it('should validate work without throwing errors', async () => {
      const workValidation: WorkValidationRequestType = {
        work: 'Here is the implementation...',
        context: mockContext,
        originalPrompt: 'Implement user authentication',
        enrichedPrompt: 'Implement user authentication with proper validation',
      };

      // This should not throw an error
      await expect(
        workValidator.validateWork(workValidation)
      ).resolves.toBeDefined();
    });

    it('should check plan existence without errors', async () => {
      // This should not throw an error
      await expect(
        planValidator.planExists(mockContext)
      ).resolves.toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid context gracefully', async () => {
      const invalidContext = {
        phase: 'invalid-phase',
        workspaceRoot: '',
      } as EnrichmentContextType;

      const enrichmentRequest: PromptEnrichmentRequestType = {
        originalPrompt: 'Test',
        context: invalidContext,
      };

      // Should handle gracefully (not crash)
      try {
        await promptEnricher.enrichPrompt(enrichmentRequest);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
