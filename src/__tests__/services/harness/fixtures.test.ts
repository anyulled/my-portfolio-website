import {
  getHarnessPhotos,
  getHarnessPricing,
  getHarnessTestimonials,
} from "@/services/harness/fixtures";

describe("Harness fixtures", () => {
  it("provides a local photograph", () => {
    const photos = getHarnessPhotos("hero");

    expect(photos).toHaveLength(1);
    expect(photos[0].srcSet[0].src).toBe("/images/DSC_7028.jpg");
  });

  it("honors a non-positive photo limit", () => {
    const photos = getHarnessPhotos("hero", 0);

    expect(photos).toEqual([]);
  });

  it("uses the text-only pricing image fallback", () => {
    const photos = getHarnessPhotos("pricing");

    expect(photos).toEqual([]);
  });

  it("provides deterministic testimonials", () => {
    const testimonials = getHarnessTestimonials();

    expect(testimonials).toEqual([
      expect.objectContaining({
        id: "harness-testimonial",
        featured: true,
        rating: 5,
      }),
    ]);
  });

  it("provides deterministic pricing", () => {
    const pricing = getHarnessPricing();

    expect(pricing).toEqual(
      expect.objectContaining({
        id: "harness-pricing",
        express_price: 200,
        experience_price: 350,
        deluxe_price: 600,
      }),
    );
  });
});
