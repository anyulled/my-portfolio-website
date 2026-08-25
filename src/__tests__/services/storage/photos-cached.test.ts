/** @jest-environment node */
import { getPhotosFromStorage } from "@/services/storage/photos-cached";
import { getPhotosFromStorage as getPhotosFromStorageUncached } from "@/services/storage/photos";

// Unmock the module we are testing (it's mocked in jest.setup.js)
jest.unmock("@/services/storage/photos-cached");

jest.mock("@/services/storage/photos", () => ({
  getPhotosFromStorage: jest.fn().mockResolvedValue([]),
}));

const mockGetPhotosFromStorage = jest.mocked(getPhotosFromStorageUncached);

jest.mock("next/cache", () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

describe("getPhotosFromStorage (cached)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should cache each photo query with its arguments", async () => {
    await getPhotosFromStorage("hero", 6);

    expect(mockGetPhotosFromStorage).toHaveBeenCalledWith("hero", 6);

    await getPhotosFromStorage("", 12);

    expect(mockGetPhotosFromStorage).toHaveBeenCalledWith("", 12);
  });
});
