import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://boudoir.barcelona";
  const publicPaths = [
    "",
    "/about",
    "/pricing",
    "/what-is-boudoir",
    "/professional-portfolio-photography",
    "/faq",
    "/styles",
    "/our-process",
    "/boudoir-myths",
    "/testimonials",
    "/session-preparation",
    "/legal",
    "/cookies",
    "/privacy",
    "/photography-release",
    "/model-release",
  ] as const;

  return publicPaths.map((path) => ({ url: `${baseUrl}${path}` }));
}
