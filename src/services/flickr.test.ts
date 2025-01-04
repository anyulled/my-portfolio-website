import { getFlickrPhotos, processFlickrPhotos } from "./flickr";

describe("getFlickrPhotos", () => {
  const mockFlickr = jest.fn();
  const config = { userId: "76279599@N00", apiKey: "fakeApiKey" };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return photos successfully", async () => {
    const mockResponse = {
      photos: {
        photo: [
          {
            id: 1,
            description: { _content: "Photo 1" },
            datetaken: "2023-01-01 12:00:00",
            dateupload: "1672531200",
            height_l: "800",
            title: "Title 1",
            url_c: "urlCrop1",
            url_l: "urlLarge1",
            url_m: "urlMedium1",
            url_n: "urlNormal1",
            url_o: "urlOriginal1",
            url_t: "urlThumbnail1",
            url_s: "urlSmall1",
            url_z: "urlZoom1",
            views: "100",
            width_l: "600",
          },
        ],
      },
    };

    mockFlickr.mockResolvedValue(mockResponse);

    const result = await getFlickrPhotos(mockFlickr, config, "test", 5);

    expect(result.success).toBe(true);
    expect(result.photos).toHaveLength(1);
    expect(result.photos?.[0].title).toBe("Title 1");
  });

  it("should handle no photos found", async () => {
    const mockResponse = {
      photos: {
        photo: [],
      },
    };

    mockFlickr.mockResolvedValue(mockResponse);

    const result = await getFlickrPhotos(mockFlickr, config, "test", 5);

    expect(result.success).toBe(false);
    expect(result.reason).toBe("No photos found");
  });

  it("should handle API errors", async () => {
    const errorMessage = "API error";
    mockFlickr.mockRejectedValue(new Error(errorMessage));

    const result = await getFlickrPhotos(mockFlickr, config, "test", 5);

    expect(result.success).toBe(false);
    expect(result.reason).toBe(errorMessage);
  });

  it("should sort photos by date taken", async () => {
    const mockResponse = {
      photos: {
        photo: [
          {
            id: 1,
            description: { _content: "Photo 1" },
            datetaken: "2023-01-02 12:00:00",
            dateupload: "1672617600",
            height_l: "800",
            title: "Title 1",
            url_c: "urlCrop1",
            url_l: "urlLarge1",
            url_m: "urlMedium1",
            url_n: "urlNormal1",
            url_o: "urlOriginal1",
            url_t: "urlThumbnail1",
            url_s: "urlSmall1",
            url_z: "urlZoom1",
            views: "100",
            width_l: "600",
          },
          {
            id: 2,
            description: { _content: "Photo 2" },
            datetaken: "2023-01-01 12:00:00",
            dateupload: "1672531200",
            height_l: "800",
            title: "Title 2",
            url_c: "urlCrop2",
            url_l: "urlLarge2",
            url_m: "urlMedium2",
            url_n: "urlNormal2",
            url_o: "urlOriginal2",
            url_t: "urlThumbnail2",
            url_s: "urlSmall2",
            url_z: "urlZoom2",
            views: "200",
            width_l: "600",
          },
        ],
      },
    };

    mockFlickr.mockResolvedValue(mockResponse);

    const result = await getFlickrPhotos(
      mockFlickr,
      config,
      "test",
      5,
      true,
      false,
    );

    expect(result.success).toBe(true);
    expect(result.photos?.[0].title).toBe("Title 1"); // Most recent date
  });

  it("should sort photos by views", async () => {
    const mockResponse = {
      photos: {
        photo: [
          {
            id: 1,
            description: { _content: "Photo 1" },
            datetaken: "2023-01-01 12:00:00",
            dateupload: "1672531200",
            height_l: "800",
            title: "Title 1",
            url_c: "urlCrop1",
            url_l: "urlLarge1",
            url_m: "urlMedium1",
            url_n: "urlNormal1",
            url_o: "urlOriginal1",
            url_t: "urlThumbnail1",
            url_s: "urlSmall1",
            url_z: "urlZoom1",
            views: "100",
            width_l: "600",
          },
          {
            id: 2,
            description: { _content: "Photo 2" },
            datetaken: "2023-01-02 12:00:00",
            dateupload: "1672617600",
            height_l: "800",
            title: "Title 2",
            url_c: "urlCrop2",
            url_l: "urlLarge2",
            url_m: "urlMedium2",
            url_n: "urlNormal2",
            url_o: "urlOriginal2",
            url_t: "urlThumbnail2",
            url_s: "urlSmall2",
            url_z: "urlZoom2",
            views: "200",
            width_l: "600",
          },
        ],
      },
    };

    mockFlickr.mockResolvedValue(mockResponse);

    const result = await getFlickrPhotos(
      mockFlickr,
      config,
      "test",
      5,
      false,
      true,
    );

    expect(result.success).toBe(true);
    expect(result.photos?.[0].title).toBe("Title 2"); // Most views
  });
});

describe("processFlickrPhotos", () => {
  it("should process Flickr photos correctly", () => {
    const mockPhotosFlickr = [
      {
        id: 1,
        description: { _content: "Photo 1" },
        datetaken: "2023-01-01 12:00:00",
        dateupload: "1672531200",
        height_l: "800",
        title: "Title 1",
        url_c: "urlCrop1",
        url_l: "urlLarge1",
        url_m: "urlMedium1",
        url_n: "urlNormal1",
        url_o: "urlOriginal1",
        url_t: "urlThumbnail1",
        url_s: "urlSmall1",
        url_z: "urlZoom1",
        views: "100",
        width_l: "600",
      },
    ];

    const result = processFlickrPhotos(mockPhotosFlickr);

    expect(result.success).toBe(true);
    expect(result.photos).toHaveLength(1);
    expect(result.photos[0].title).toBe("Title 1");
  });
});
