/**
 * Concurrently maps an array with a maximum concurrency limit.
 *
 * @param array The array to map.
 * @param mapper The mapping function.
 * @param concurrency Limit on concurrent executions. Default is 10.
 * @returns A promise that resolves to an array of mapped values.
 */
export async function concurrentMap<T, R>(
  array: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency = 10,
): Promise<R[]> {
  const results: R[] = new Array<R>(array.length);
  // eslint-disable-next-line no-restricted-syntax
  let currentIndex = 0;

  const worker = async () => {
    while (true) {
      const index = currentIndex++;
      if (index >= array.length) {
        break;
      }
      // eslint-disable-next-line security/detect-object-injection
      results[index] = await mapper(array[index], index);
    }
  };

  const workerCount = Math.min(concurrency, array.length);
  const workers = new Array(workerCount).fill(null).map(worker);
  await Promise.all(workers);

  return results;
}
