import {
  collectionDraftSchema,
  profileUrlSchema,
} from "@/services/portfolio/validation";

const validDraft = {
  name: "Summer session",
  slug: "summer-session",
  sessionDate: "2026-09-26",
  location: "Barcelona",
  style: "boudoir",
  lingerieBrand: "",
  modelIds: ["123e4567-e89b-12d3-a456-426614174000"],
  newModels: [],
  driveImages: [{ id: "drive-image-1", name: "Image one" }],
};

describe("portfolio validation", () => {
  it.each(["https://example.com/model", "http://example.com/model"])(
    "accepts HTTP profile URLs: %s",
    (url) => {
      expect(profileUrlSchema.safeParse(url).success).toBe(true);
    },
  );

  it.each(["javascript:alert(1)", "ftp://example.com/model", "not-a-url"])(
    "rejects unsafe profile URLs: %s",
    (url) => {
      expect(profileUrlSchema.safeParse(url).success).toBe(false);
    },
  );

  it("accepts a complete collection draft", () => {
    expect(collectionDraftSchema.safeParse(validDraft).success).toBe(true);
  });

  it.each([
    { ...validDraft, slug: "Bad Slug" },
    { ...validDraft, sessionDate: "26-09-2026" },
    { ...validDraft, style: "wedding" },
    { ...validDraft, driveImages: [] },
    { ...validDraft, modelIds: [], newModels: [] },
    {
      ...validDraft,
      driveImages: [
        { id: "same", name: "First" },
        { id: "same", name: "Second" },
      ],
    },
  ])("rejects invalid collection data", (draft) => {
    expect(collectionDraftSchema.safeParse(draft).success).toBe(false);
  });
});
