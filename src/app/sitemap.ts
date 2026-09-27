import { getPricing } from "@/lib/pricing";
import type { MetadataRoute } from "next";
import { connection } from "next/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const pricing = await getPricing().catch(() => null);
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

  return publicPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    ...(path === "/pricing" && pricing?.inserted_at
      ? { lastModified: pricing.inserted_at }
      : {}),
  }));
}
