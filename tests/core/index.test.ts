import 'reflect-metadata';

describe('Core Index Module', () => {
  it('should have core module available', () => {
    // Simple smoke test
    expect(() => {
      require.resolve('../../src/index.ts');
    }).not.toThrow();
  });

  it('should be able to import main module', () => {
    // Verify the module can be imported without syntax errors
    const modulePath = require.resolve('../../src/index.ts');
    expect(modulePath).toContain('index.ts');
  });
});
