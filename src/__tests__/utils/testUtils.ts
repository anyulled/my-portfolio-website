import { PhotoFlickr } from "@/services/flickr/flickr.types";

export const commonBeforeEach = (): void => {
  jest.clearAllMocks();

  if (typeof window !== "undefined") {
    window.matchMedia = window.matchMedia
      || ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })) as unknown as typeof window.matchMedia;
  }

  const IntersectionObserverMock = class {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  };

  const ResizeObserverMock = class {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  };

  Object.defineProperty(global, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: IntersectionObserverMock,
  });

  Object.defineProperty(global, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: ResizeObserverMock,
  });

  Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
    writable: true,
    configurable: true,
    value: jest.fn(),
  });
};

export const mockPhotoFlickr: PhotoFlickr[] = [
  {
    id: 123,
    title: "Test Photo",
    description: { _content: "Test Description" },
    datetaken: "2023-01-01 12:00:00",
    dateupload: "1672531200",
    tags: "test",
    views: "100",
    url_s: "http://example.com/small.jpg",
    url_m: "http://example.com/medium.jpg",
    url_n: "http://example.com/normal.jpg",
    url_l: "http://example.com/large.jpg",
    url_o: "http://example.com/original.jpg",
    url_t: "http://example.com/thumbnail.jpg",
    url_z: "http://example.com/zoom.jpg",
    url_c: "http://example.com/crop.jpg",
    width_s: "240",
    width_m: "500",
    width_n: "320",
    width_l: "1024",
    width_o: "2048",
    width_t: "100",
    width_z: "640",
    width_c: "800",
    height_s: "180",
    height_m: "375",
    height_n: "240",
    height_l: "768",
    height_o: "1536",
    height_t: "75",
    height_z: "480",
    height_c: "600"
  }
];

describe("Test Utilities", () => {
  describe("Mock Data", () => {
    it("should provide mock Flickr photo data", () => {
      expect(mockPhotoFlickr).toHaveLength(1);
      expect(mockPhotoFlickr[0].id).toBe(123);
      expect(mockPhotoFlickr[0].title).toBe("Test Photo");
    });
  });
});
