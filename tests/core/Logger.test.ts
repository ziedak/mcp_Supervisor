import { Logger } from '../../src/core/services/Logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
  });

  describe('Basic Functionality', () => {
    it('should create logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should have logging methods', () => {
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should handle logging calls without throwing', () => {
      expect(() => logger.debug('Debug message')).not.toThrow();
      expect(() => logger.info('Info message')).not.toThrow();
      expect(() => logger.warn('Warning message')).not.toThrow();
      expect(() => logger.error('Error message')).not.toThrow();
    });

    it('should handle logging with additional data', () => {
      const testData = { key: 'value', number: 42 };

      expect(() => logger.debug('Debug with data', testData)).not.toThrow();
      expect(() => logger.info('Info with data', testData)).not.toThrow();
      expect(() => logger.warn('Warning with data', testData)).not.toThrow();
      expect(() =>
        logger.error('Error with data', undefined, testData)
      ).not.toThrow();
    });

    it('should handle error logging with Error objects', () => {
      const error = new Error('Test error');
      const meta = { context: 'test' };

      expect(() => logger.error('Error occurred', error, meta)).not.toThrow();
    });

    it('should handle error logging without Error objects', () => {
      const meta = { context: 'test' };

      expect(() =>
        logger.error('Error occurred', undefined, meta)
      ).not.toThrow();
    });
  });
});
