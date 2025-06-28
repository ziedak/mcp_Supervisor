/**
 * promisePool - Utility for running async tasks with concurrency control
 * Follows SOLID principles: single responsibility, reusable, testable
 */
export async function promisePool<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  let i = 0;
  const pool: Promise<void>[] = [];
  async function runTask() {
    if (i >= tasks.length) return;
    const idx = i++;
    const task = tasks[idx];
    if (task) {
      results[idx] = await task();
    }
    await runTask();
  }
  for (let j = 0; j < Math.min(concurrency, tasks.length); j++) {
    pool.push(runTask());
  }
  await Promise.all(pool);
  return results;
}
