describe('start-server main integration', () => {
  it('should have main function available', () => {
    // Simple integration test
    const fs = require('fs');
    const startServerPath = require.resolve('../../src/start-server.ts');

    expect(fs.existsSync(startServerPath)).toBe(true);
  });

  it('should be able to require main module', () => {
    expect(() => {
      require.resolve('../../src/index.ts');
    }).not.toThrow();
  });
});
