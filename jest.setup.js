// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Reset modules before each test
beforeEach(() => {
  jest.resetModules();
});

// Mock the gtag module
jest.mock("@/lib/gtag", () => ({
  event: jest.fn(),
}));

jest.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    scrollerProxy: jest.fn(),
    update: jest.fn(),
    getAll: jest.fn(() => []),
  },
}));

// Create a mock for next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock chalk to avoid ESM issues
jest.mock("chalk", () => {
  const mockChalk = (text) => text;
  mockChalk.red = (text) => text;
  mockChalk.green = (text) => text;
  mockChalk.gray = (text) => text;
  mockChalk.blue = (text) => text;
  mockChalk.cyan = (text) => text;
  mockChalk.yellow = (text) => text;
  mockChalk.bold = (text) => text;
  mockChalk.italic = (text) => text;

  // Add nested methods
  mockChalk.blue.bold = (text) => text;
  mockChalk.green.bold = (text) => text;
  mockChalk.red.bold = (text) => text;
  mockChalk.cyan.italic = (text) => text;
  mockChalk.green.italic = (text) => text;

  return mockChalk;
});

// Create any other global mocks here
