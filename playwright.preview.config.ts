import { defineConfig, devices } from "@playwright/test";

const previewBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

if (!previewBaseUrl) {
  throw new Error("PLAYWRIGHT_BASE_URL is required for preview verification");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  workers: 2,
  reporter: [
    ["list"],
    ["junit", { outputFile: "test-results/preview-junit.xml" }],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: previewBaseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
