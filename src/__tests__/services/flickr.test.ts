import { getFlickrPhotos, processFlickrPhotos } from "@/services/flickr/flickr";
import { getCachedData, setCachedData } from "@/services/redis";
import { mockPhotoFlickr } from "@/__tests__/utils/testUtils";

jest.mock("@/services/redis", () => {
  return {
    getCachedData: jest.fn(),
    setCachedData: jest.fn()
  };
});

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn()
}));

describe("Flickr Service", () => {
  const mockFlickr = jest.fn();

  describe("processFlickrPhotos", () => {
    it("should process Flickr photos correctly", () => {
      const result = processFlickrPhotos(mockPhotoFlickr);

      expect(result.success).toBe(true);
      expect(result.reason).toBeNull();
      expect(result.photos).toHaveLength(1);

      const processedPhoto = result.photos![0];
      expect(processedPhoto.id).toBe(123);
      expect(processedPhoto.title).toBe("Test Photo");
      expect(processedPhoto.description).toBe("Test Description");
      expect(processedPhoto.dateTaken).toBeInstanceOf(Date);
      expect(processedPhoto.dateUpload).toBeInstanceOf(Date);
      expect(processedPhoto.views).toBe(100);
      expect(processedPhoto.tags).toBe("test");
      expect(processedPhoto.urlSmall).toBe("http://example.com/small.jpg");
      expect(processedPhoto.urlMedium).toBe("http://example.com/medium.jpg");
      expect(processedPhoto.srcSet).toHaveLength(8); // 8 different sizes
    });
  });

  describe("getFlickrPhotos", () => {
    it("should fetch photos from Flickr API and cache them", async () => {
      mockFlickr.mockResolvedValue({
        photos: {
          photo: mockPhotoFlickr
        }
      });

      const result = await getFlickrPhotos(mockFlickr, "test", 5);

      expect(mockFlickr).toHaveBeenCalledWith(
        "flickr.photos.search",
        expect.objectContaining({
          tags: "test",
          user_id: "76279599@N00"
        })
      );

      expect(setCachedData).toHaveBeenCalledWith(
        "test",
        mockPhotoFlickr,
        expect.any(Number)
      );

      expect(result.success).toBe(true);
      expect(result.photos).toHaveLength(1);
    });

    it("should return photos from cache when API fails", async () => {
      mockFlickr.mockRejectedValue(new Error("API error"));

      getCachedData.mockResolvedValue(mockPhotoFlickr);

      const result = await getFlickrPhotos(mockFlickr, "test", 5);

      expect(mockFlickr).toHaveBeenCalled();

      expect(getCachedData).toHaveBeenCalledWith("test");

      expect(result.success).toBe(true);
      expect(result.photos).toHaveLength(1);
    });

    it("should return error when both API and cache fail", async () => {
      mockFlickr.mockRejectedValue(new Error("API error"));

      getCachedData.mockResolvedValue(null);

      const result = await getFlickrPhotos(mockFlickr, "test", 5);

      expect(mockFlickr).toHaveBeenCalled();

      expect(getCachedData).toHaveBeenCalledWith("test");

      expect(result.success).toBe(false);
      expect(result.photos).toBeNull();
      expect(result.reason).toBe(
        "[ Flickr ] Failed to get photos from both Flickr API and cache for tags: test"
      );
    });

    it("should sort photos by date when orderByDate is true", async () => {
      const photosWithDates = [
        { ...mockPhotoFlickr[0], datetaken: "2023-01-01 12:00:00" },
        {
          ...mockPhotoFlickr[0],
          id: 456,
          datetaken: "2023-02-01 12:00:00"
        },
        {
          ...mockPhotoFlickr[0],
          id: 789,
          datetaken: "2023-03-01 12:00:00"
        }
      ];

      mockFlickr.mockResolvedValue({
        photos: {
          photo: photosWithDates
        }
      });

      const result = await getFlickrPhotos(mockFlickr, "test", 5, true, false);

      expect(result.success).toBe(true);
      expect(result.photos).toHaveLength(3);
      expect(result.photos![0].id).toBe(789); // Most recent
      expect(result.photos![1].id).toBe(456);
      expect(result.photos![2].id).toBe(123); // Oldest
    });

    it("should sort photos by views when orderByViews is true", async () => {
      const photosWithViews = [
        { ...mockPhotoFlickr[0], id: 123, views: "100" },
        { ...mockPhotoFlickr[0], id: 456, views: "200" },
        { ...mockPhotoFlickr[0], id: 789, views: "300" }
      ];

      mockFlickr.mockResolvedValue({
        photos: {
          photo: photosWithViews
        }
      });

      const result = await getFlickrPhotos(mockFlickr, "test", 5, false, true);

      expect(result.success).toBe(true);
      expect(result.photos).toHaveLength(3);
      expect(result.photos![0].id).toBe(789); // Most views
      expect(result.photos![1].id).toBe(456);
      expect(result.photos![2].id).toBe(123); // Least views
    });

    it("should limit the number of photos returned", async () => {
      const multiplePhotos = [
        { ...mockPhotoFlickr[0], id: 123 },
        { ...mockPhotoFlickr[0], id: 456 },
        { ...mockPhotoFlickr[0], id: 789 },
        { ...mockPhotoFlickr[0], id: 101 },
        { ...mockPhotoFlickr[0], id: 102 }
      ];

      mockFlickr.mockResolvedValue({
        photos: {
          photo: multiplePhotos
        }
      });

      const result = await getFlickrPhotos(mockFlickr, "test", 3);

      expect(result.success).toBe(true);
      expect(result.photos).toHaveLength(3);
    });

    it("should exclude photos with excluded tags", async () => {
      const photosWithTags = [
        { ...mockPhotoFlickr[0], id: 123, tags: "test good" },
        { ...mockPhotoFlickr[0], id: 456, tags: "test bad" },
        { ...mockPhotoFlickr[0], id: 789, tags: "test exclude" }
      ];

      mockFlickr.mockResolvedValue({
        photos: {
          photo: photosWithTags
        }
      });

      const result = await getFlickrPhotos(mockFlickr, "test,-bad,-exclude", 5);

      expect(result.success).toBe(true);
      expect(result.photos).toHaveLength(1);
      expect(result.photos![0].id).toBe(123);
    });
  });
});
