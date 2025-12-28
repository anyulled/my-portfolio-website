import { Photo } from "@/types/photos";

export const commonBeforeEach = (): void => {
  jest.clearAllMocks();

  if (typeof window !== "undefined") {
    window.matchMedia =
      window.matchMedia ||
      (((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })) as unknown as typeof window.matchMedia);
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

export const mockPhotos: Photo[] = [
  {
    id: 123,
    title: "Test Photo",
    description: "Test Description",
    dateTaken: new Date("2023-01-01T12:00:00Z"),
    dateUpload: new Date(1672531200 * 1000),
    tags: "test",
    views: 100,
    width: 1024,
    height: 768,
    srcSet: [
      {
        src: "http://example.com/large.jpg",
        description: "Test Description",
        width: 1024,
        height: 768,
        title: "Test Photo",
      },
    ],
  },
];
