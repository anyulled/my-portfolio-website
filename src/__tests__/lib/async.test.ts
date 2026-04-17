import { concurrentMap } from "@/lib/async";

describe("concurrentMap", () => {
  it("should map an array of items correctly", async () => {
    const array = [1, 2, 3, 4, 5];
    const mapper = async (item: number) => item * 2;
    const result = await concurrentMap(array, mapper, 2);
    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it("should process items with the specified concurrency limit", async () => {
    const array = [1, 2, 3, 4, 5];
    const inFlight = new Set<number>();
    let maxInFlight = 0;

    const mapper = async (item: number) => {
      inFlight.add(item);
      maxInFlight = Math.max(maxInFlight, inFlight.size);
      // Simulate async work
      await new Promise((resolve) => setTimeout(resolve, 10));
      inFlight.delete(item);
      return item * 2;
    };

    const result = await concurrentMap(array, mapper, 2);
    expect(result).toEqual([2, 4, 6, 8, 10]);
    expect(maxInFlight).toBeLessThanOrEqual(2);
  });

  it("should handle an empty array", async () => {
    const array: number[] = [];
    const mapper = async (item: number) => item * 2;
    const result = await concurrentMap(array, mapper, 2);
    expect(result).toEqual([]);
  });

  it("should handle concurrency limit greater than array length", async () => {
    const array = [1, 2, 3];
    const mapper = async (item: number) => item * 2;
    const result = await concurrentMap(array, mapper, 10);
    expect(result).toEqual([2, 4, 6]);
  });

  it("should handle errors in the mapper function", async () => {
    const array = [1, 2, 3, 4, 5];
    const mapper = async (item: number) => {
      if (item === 3) {
        throw new Error("Test error");
      }
      return item * 2;
    };

    await expect(concurrentMap(array, mapper, 2)).rejects.toThrow("Test error");
  });

  it("should pass the correct index to the mapper function", async () => {
    const array = ["a", "b", "c"];
    const mapper = async (item: string, index: number) => `${item}-${index}`;
    const result = await concurrentMap(array, mapper, 2);
    expect(result).toEqual(["a-0", "b-1", "c-2"]);
  });
});
