jest.mock("@/components/AboutContent", () => () => null);
jest.mock("@/components/AnimatedPackages", () => () => null);
jest.mock("@/components/BoudoirContent", () => () => null);
jest.mock("@/components/ContactForm", () => () => null);
jest.mock("@/components/FadeInTitle", () => () => null);
jest.mock("@/components/Gallery", () => () => null);
jest.mock("@/components/Hero", () => () => null);
jest.mock("@/components/SocialMedia", () => () => null);
jest.mock("@/components/TestimonialsGrid", () => () => null);
jest.mock("@/components/ui/separator", () => ({ Separator: () => null }));
jest.mock("@/app/boudoir-myths/MythIntro", () => () => null);
jest.mock("@/app/boudoir-myths/MythsCTA", () => () => null);
jest.mock("@/app/boudoir-myths/MythsHero", () => () => null);
jest.mock("@/app/boudoir-myths/MythsList", () => () => null);
jest.mock("@/app/boudoir-myths/TruthSection", () => () => null);
jest.mock("@/app/testimonials/TestimonialHero", () => () => null);
jest.mock("@/app/testimonials/TestimonialsCTA", () => () => null);
jest.mock("@/services/storage/photos-cached", () => ({
  getPhotosFromStorage: jest.fn(),
}));
jest.mock("next/font/google", () => ({
  Aref_Ruqaa: jest.fn(() => ({ className: "" })),
  Dancing_Script: jest.fn(() => ({ className: "" })),
  Playfair_Display: jest.fn(() => ({ className: "" })),
}));
jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(),
}));

import { metadata as aboutMetadata } from "@/app/about/page";
import { metadata as mythsMetadata } from "@/app/boudoir-myths/page";
import { metadata as faqMetadata } from "@/app/faq/page";
import { metadata as processMetadata } from "@/app/our-process/page";
import { metadata as homeMetadata } from "@/app/page";
import { metadata as pricingMetadata } from "@/app/pricing/page";
import { metadata as styleGuideMetadata } from "@/app/style-guide/page";
import { metadata as stylesMetadata } from "@/app/styles/page";
import { metadata as testimonialsMetadata } from "@/app/testimonials/page";
import { metadata as whatIsBoudoirMetadata } from "@/app/what-is-boudoir/page";

const pageMetadata = [
  [
    "about",
    aboutMetadata,
    "Meet Anyul Rivas, a portrait and boudoir photographer based in Barcelona, creating elegant, confidence-building images in a private, supportive setting.",
  ],
  [
    "boudoir myths",
    mythsMetadata,
    "Separate fact from fiction with five common boudoir photography myths debunked, and discover how a private, body-positive session can celebrate your confidence.",
  ],
  [
    "FAQ",
    faqMetadata,
    "Get answers about boudoir photography sessions, including preparation, pricing, privacy, posing, and what to expect during and after your Barcelona shoot.",
  ],
  [
    "our process",
    processMetadata,
    "Follow our Barcelona boudoir photography process from consultation through planning, your guided session, image selection, and final artwork delivery.",
  ],
  [
    "home",
    homeMetadata,
    "Intimate, elegant boudoir photography in Barcelona, with empowering portraits, expert guidance, luxe styling, and a private experience tailored to you.",
  ],
  [
    "pricing",
    pricingMetadata,
    "Explore boudoir photography pricing in Barcelona, compare our Express, Experience, and Deluxe Experience packages, and choose the session that suits you.",
  ],
  [
    "style guide",
    styleGuideMetadata,
    "Prepare for your boudoir session with our comprehensive Barcelona style guide, including wardrobe, makeup, posing, and tips for a confident experience.",
  ],
  [
    "photography styles",
    stylesMetadata,
    "Explore private boudoir photography styles in Barcelona, from soft and romantic to bold and editorial, and find the visual approach that feels most like you.",
  ],
  [
    "testimonials",
    testimonialsMetadata,
    "Read authentic client stories from boudoir photography sessions in Barcelona and discover how a guided experience builds confidence and celebrates your beauty.",
  ],
  [
    "what is boudoir",
    whatIsBoudoirMetadata,
    "Discover what boudoir photography is and how our Barcelona sessions combine guidance, elegant portraiture, and a confidence-building experience tailored to you.",
  ],
] as const;

describe("page metadata descriptions", () => {
  it.each(pageMetadata)(
    "%s has an SEO-ready description",
    (_pageName, metadata, expectedDescription) => {
      expect(metadata.description).toBe(expectedDescription);
      expect(expectedDescription.length).toBeGreaterThanOrEqual(150);
      expect(expectedDescription.length).toBeLessThanOrEqual(160);
    },
  );
});
