export async function concurrentMap<T, R>(
  array: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency = 10,
): Promise<R[]> {
  const batches = Array.from(
    { length: Math.ceil(array.length / concurrency) },
    (_, batchIndex) =>
      array.slice(batchIndex * concurrency, (batchIndex + 1) * concurrency),
  );

  const mappedBatches = await batches.reduce<Promise<R[][]>>(
    async (previousBatches, batch, batchIndex) => {
      const completedBatches = await previousBatches;
      const mappedBatch = await Promise.all(
        batch.map((item, itemIndex) =>
          mapper(item, batchIndex * concurrency + itemIndex),
        ),
      );
      return [...completedBatches, mappedBatch];
    },
    Promise.resolve([]),
  );

  return mappedBatches.flat();
}
