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
