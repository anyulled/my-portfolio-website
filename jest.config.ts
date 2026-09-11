import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

/** Custom Jest configuration */
const customJestConfig = {
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }] as [
      string,
      Record<string, unknown>,
    ],
  },
  // Module name mappings for path aliases and mocks
  moduleNameMapper: {
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^isows$": "<rootDir>/src/__mocks__/isows.js",
    "^uncrypto$": "<rootDir>/src/__mocks__/uncrypto.js",
    "^@google-cloud/storage$": "<rootDir>/src/__mocks__/googleCloudStorage.ts",
    "^ai$": "<rootDir>/src/__mocks__/ai.ts",
    "^@ai-sdk/groq$": "<rootDir>/src/__mocks__/groq.ts",
  },
  testEnvironment: "@stryker-mutator/jest-runner/jest-env/jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    "<rootDir>/.stryker-tmp/",
  ],
  transformIgnorePatterns: [
    "/node_modules/(?!(chalk|@upstash|@sentry|next-intl|uncrypto|isows|@supabase|gsap|ai|@ai-sdk)/)",
    "^.+\\.module\\.(css|sass|scss)$",
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!**/node_modules/**",
  ],
  testMatch: ["**/__tests__/**/*.test.{ts,tsx,js,jsx}"],
};

export default createJestConfig(customJestConfig);
