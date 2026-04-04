import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseURL = "https://boudoir.barcelona";
  /*
   * ⚡ Bolt: Hoisted the current date instantiation outside the array
   * to avoid allocating redundant Date objects for every sitemap entry.
   */
  const now = new Date();

  return [
    {
      url: baseURL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseURL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseURL}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseURL}/what-is-boudoir`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseURL}/legal`,
      lastModified: now,
      changeFrequency: "never",
      priority: 0.3,
    },
    {
      url: `${baseURL}/cookies`,
      lastModified: now,
      changeFrequency: "never",
      priority: 0.3,
    },
    {
      url: `${baseURL}/privacy`,
      lastModified: now,
      changeFrequency: "never",
      priority: 0.3,
    },
    {
      url: `${baseURL}/testimonials`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];
}
