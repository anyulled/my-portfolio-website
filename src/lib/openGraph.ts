import { OpenGraph } from "next/dist/lib/metadata/types/opengraph-types";

export const openGraph: OpenGraph = {
  title: {
    default: "Sensuelle Boudoir · Boudoir Photography in Barcelona",
    template: "%s · Boudoir photography service in Barcelona",
  },
  description: "Boudoir photography service in Barcelona.",
  url: "https://boudoir.barcelona",
  siteName: "Sensuelle Boudoir · Boudoir Photography in Barcelona",
  images: [
    {
      url: "https://live.staticflickr.com/65535/53367295647_2ff0fdf881_h.jpg",
      width: 1200,
      height: 630,
      alt: "Boudoir photography in Barcelona",
    },
  ],
  locale: "en_US",
  type: "website",
};
