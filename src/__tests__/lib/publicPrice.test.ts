import { publicPrice } from "@/lib/publicPrice";

describe("publicPrice", () => {
  it.each([225, "225.50", 0])("accepts a stored amount of %s", (value) => {
    expect(publicPrice(value)).toBe(Number(value));
  });

  it.each([null, undefined, "", " ", "unknown", -1, Number.NaN, Infinity])(
    "does not publish an invalid amount of %s",
    (value) => {
      expect(publicPrice(value)).toBeNull();
    },
  );
});
