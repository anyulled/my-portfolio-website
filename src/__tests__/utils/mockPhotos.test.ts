import { mockPhotos } from "./testUtils";

describe("Test Utilities", () => {
  describe("Mock Data", () => {
    it("should provide mock photo data", () => {
      expect(mockPhotos).toHaveLength(1);
      expect(mockPhotos[0].id).toBe(123);
      expect(mockPhotos[0].title).toBe("Test Photo");
    });
  });
});
