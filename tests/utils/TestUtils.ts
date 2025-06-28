/**
 * Utility functions for tests
 */
export class TestUtils {
  /**
   * Sleep for the given number of milliseconds
   * Useful for waiting for async operations to complete
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for a condition to be true
   * @param condition Function that returns true when the condition is met
   * @param timeout Maximum time to wait in milliseconds
   * @param interval Check interval in milliseconds
   */
  static async waitFor(
    condition: () => boolean,
    timeout = 5000,
    interval = 100
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return true;
      }
      await this.sleep(interval);
    }

    return false;
  }
}
