import { expect, test } from "@playwright/test";

const publicPaths = [
  "/",
  "/pricing",
  "/photography-release",
  "/model-release",
  "/booking-a-session",
  "/instagram/login",
  "/portfolio",
  "/portfolio/barcelona-editorial-session",
  "/models",
  "/models/harness-model",
  "/styles",
  "/styles/boudoir",
];

test.describe("public harness journeys", () => {
  for (const publicPath of publicPaths) {
    test(`${publicPath} renders without server or browser errors`, async ({
      page,
    }) => {
      const browserErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") {
          browserErrors.push(message.text());
        }
      });

      const response = await page.goto(publicPath, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator("body")).toBeVisible();
      expect(browserErrors).toEqual([]);
    });
  }

  test("portfolio pages expose localized SEO metadata and generated OG art", async ({
    page,
  }) => {
    await page.goto("/portfolio/barcelona-editorial-session");

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /boudoir photography by Anyul Rivas/i,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /opengraph-image/,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
  });

  test("booking requires the core contact fields before submission", async ({
    page,
  }) => {
    await page.goto("/booking-a-session");

    await page.getByRole("button", { name: /submit|send|enviar/i }).click();

    await expect(page.locator("#fullName + p")).toBeVisible();
    await expect(page.locator("#email + p")).toBeVisible();
    await expect(page.locator("#country + p")).toBeVisible();
  });

  test("image resize cron rejects unauthenticated requests", async ({
    request,
  }) => {
    const response = await request.get("/api/cron/resize-images");

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });

  test("Instagram token refresh cron rejects unauthenticated requests", async ({
    request,
  }) => {
    const response = await request.get("/api/cron/refresh-instagram-tokens");

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });
});
