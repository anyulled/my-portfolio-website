import '@testing-library/jest-dom';
const { TextDecoder, TextEncoder } = require('node:util');

// Add Node.js globals for Jest environment
globalThis.TextDecoder = TextDecoder;
globalThis.TextEncoder = TextEncoder;

// Mock chalk to avoid ESM import issues in tests
jest.mock('chalk', () => ({
  default: {
    red: (str) => str,
    green: (str) => str,
    yellow: (str) => str,
    blue: (str) => str,
    cyan: (str) => str,
    magenta: (str) => str,
    white: (str) => str,
    gray: (str) => str,
    bold: (str) => str,
  },
  red: (str) => str,
  green: (str) => str,
  yellow: (str) => str,
  blue: (str) => str,
  cyan: (str) => str,
  magenta: (str) => str,
  white: (str) => str,
  gray: (str) => str,
  bold: (str) => str,
}));

// Mock next/cache - unstable_cache requires server environment
jest.mock('next/cache', () => ({
  unstable_cache: (fn) => fn
}));

// Mock photos-cached service to use original implementation in tests
jest.mock('@/services/storage/photos-cached', () => ({
  getPhotosFromStorage: jest.fn(),
}));

