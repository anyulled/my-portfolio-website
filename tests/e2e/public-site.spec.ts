import { expect, test } from "@playwright/test";

const publicPaths = [
  "/",
  "/pricing",
  "/professional-portfolio-photography",
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

  test("professional portfolio visitors can review and open a session enquiry", async ({
    page,
  }) => {
    await page.goto("/professional-portfolio-photography");

    await expect(page.getByText(/I welcome escorts/)).toBeVisible();
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "Review Sensuelle Boudoir on Google" }),
    ).toHaveAttribute("href", "https://g.page/r/CXYGEWUyinIwEBM/review");
    await page
      .getByRole("button", { name: "Enquire about a portfolio session" })
      .click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /send message/i }),
    ).toBeVisible();
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
