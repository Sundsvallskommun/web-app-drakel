/**
 * Maps every item through an async function with at most `limit` calls in flight, keeping the order of
 * the input. For fanning out reads to a system that should not be flooded.
 */
export const mapWithConcurrency = async <Item, Result>(items: Item[], limit: number, mapper: (item: Item) => Promise<Result>): Promise<Result[]> => {
  const results: Result[] = [];
  const queue = items.map((item, index) => ({ item, index }));

  const worker = async (): Promise<void> => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      results[next.index] = await mapper(next.item);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
};
