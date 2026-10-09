import braces from "braces";

describe("installed brace-pattern security guards", () => {
  it.each([
    ["{", "}"],
    ["(", ")"],
  ])(
    "rejects excessive %s nesting before recursive traversal",
    (open, close) => {
      const pattern = open.repeat(1000) + "a" + close.repeat(1000);

      expect(() => braces(pattern)).toThrow(/exceeds max depth/);
      expect(() => braces.expand(pattern)).toThrow(/exceeds max depth/);
    },
  );

  it("keeps the hard depth limit when callers request an unlimited depth", () => {
    const pattern = "{".repeat(101) + "a" + "}".repeat(101);
    const options = { maxLength: 10000, maxDepth: Infinity };

    expect(() => braces(pattern, options)).toThrow(/exceeds max depth/);
  });

  it("preserves ordinary glob compilation", () => {
    expect(braces("src/{app,services}/**/*.ts")).toEqual([
      "src/(app|services)/**/*.ts",
    ]);
  });

  it("preserves nested sets and zero-padded range expansion", () => {
    expect(braces.expand("src/{app,{01..03}}/*.ts")).toEqual([
      "src/app/*.ts",
      "src/01/*.ts",
      "src/02/*.ts",
      "src/03/*.ts",
    ]);
  });
});
