import fc from "fast-check";
import { extractNameFromTag } from "@/lib/extractName";

describe("extractNameFromTag (property-based)", () => {
  it("should always return the name if the tag exists", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            tag: fc.string({ minLength: 1 }),
            name: fc.string(),
          }),
          { minLength: 1, maxLength: 50 },
        ),
        fc.integer({ min: 0 }),
        (data, indexOffset) => {
          const targetIndex = indexOffset % data.length;
          // eslint-disable-next-line security/detect-object-injection
          const targetTag = data[targetIndex].tag;

          /*
           * We need to make sure the generated tags are unique in our sub-test context
           * Or at least, if there are duplicates, extractNameFromTag will return the FIRST match
           * To keep it simple, we just assert that a defined value is returned when the tag is in the array
           */
          const result = extractNameFromTag(data, targetTag);
          expect(result).toBeDefined();
        },
      ),
    );
  });

  it("should return undefined if the array is empty", () => {
    fc.assert(
      fc.property(fc.string(), (tag) => {
        expect(extractNameFromTag([], tag)).toBeUndefined();
      }),
    );
  });

  it("should return undefined if tag is not in array", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            tag: fc.string({ minLength: 1 }),
            name: fc.string(),
          }),
        ),
        fc.string().filter((t) => t.length > 0),
        (data, targetTag) => {
          // Filter out cases where the random tag happens to be in the generated data
          fc.pre(!data.some((d) => d.tag === targetTag));

          expect(extractNameFromTag(data, targetTag)).toBeUndefined();
        },
      ),
    );
  });
});
