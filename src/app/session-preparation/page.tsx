import FadeInTitle from "@/components/FadeInTitle";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brush,
  Check,
  Heart,
  ImageIcon,
  Music,
  Shirt,
  Sparkles,
  UserRoundPlus,
} from "lucide-react";
import type { Metadata } from "next";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import Link from "next/link";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const pageUrl = "https://boudoir.barcelona/session-preparation";
const thumbnailUrl = "/images/session-preparation-og.png";

export const metadata: Metadata = {
  title: "How to Prepare for Your Boudoir Session",
  description:
    "Simple preparation tips to help you feel comfortable, confident, and ready for your boudoir photography session in Barcelona.",
  keywords:
    "boudoir session preparation, Barcelona boudoir photography, lingerie tips, boudoir grooming tips",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    type: "article",
    url: pageUrl,
    title: "How to Prepare for Your Boudoir Session",
    description:
      "Simple preparation tips to help you feel comfortable, confident, and ready for your boudoir photography session in Barcelona.",
    images: [
      {
        url: thumbnailUrl,
        width: 1731,
        height: 909,
        alt: "Silk, lingerie, perfume, and hair brush prepared for a boudoir session",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Prepare for Your Boudoir Session",
    description:
      "Simple preparation tips to help you feel comfortable, confident, and ready for your boudoir photography session in Barcelona.",
    images: [thumbnailUrl],
  },
};

const preparationGuides = [
  {
    icon: Shirt,
    title: "Choose lingerie that feels like you",
    description:
      "Bring pieces you feel comfortable and beautiful wearing. Confidence comes from feeling at ease, so choose lingerie that lets you move, breathe, and enjoy the experience.",
  },
  {
    icon: Sparkles,
    title: "Bring variety",
    description:
      "Different colors, textures, and styles create a richer gallery. Consider bringing a mix of light and dark pieces, something delicate, and something with a little more drama.",
  },
  {
    icon: Brush,
    title: "Give your skin time to settle",
    description:
      "If you shave or trim, try to do it 24–48 hours before your session. That gives your skin time to calm down and helps minimize visible redness or irritation. Avoid trying new products or treatments right before we shoot.",
  },
  {
    icon: Heart,
    title: "Keep your hair humidity-ready",
    description:
      "Barcelona’s humidity can encourage frizz. Bring the hair products that already work for you, such as an anti-frizz cream or light finishing oil, plus a brush or comb. Avoid experimenting with a new style on the day of your session.",
  },
  {
    icon: ImageIcon,
    title: "Share your vision",
    description:
      "Bring a few photo references showing the mood, poses, lighting, or styling you love. They help me understand what you are drawn to, while we create images that feel personal to you.",
  },
  {
    icon: Music,
    title: "Create your soundtrack",
    description:
      "Choose a few songs that make you feel empowered, feminine, and fully yourself. Music can shift the energy in the room and help you settle into the session.",
  },
  {
    icon: UserRoundPlus,
    title: "Bring what helps you relax",
    description:
      "If you feel nervous, you can bring a trusted friend for support. Pack water, tea, or another favorite drink. If you choose alcohol, keep it light and only have something you already know agrees with you—you never need it to feel confident here.",
  },
];

const checklist = [
  "Your favorite lingerie and a few different styles or colors",
  "Any shoes, jewelry, stockings, robes, or personal pieces you want to include",
  "Your hair products, brush, and makeup touch-up items",
  "A short list of photo references and your session playlist",
  "Water and anything that helps you feel comfortable",
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      name: "How to prepare for a boudoir photography session",
      description:
        "Practical preparation guidance for a comfortable and empowering boudoir photography session in Barcelona.",
      image: `https://boudoir.barcelona${thumbnailUrl}`,
      totalTime: "PT30M",
      step: preparationGuides.map((guide, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: guide.title,
        text: guide.description,
      })),
    },
    {
      "@type": "WebPage",
      name: "How to Prepare for Your Boudoir Session",
      url: pageUrl,
      description:
        "Simple preparation tips to help you feel comfortable, confident, and ready for your boudoir photography session in Barcelona.",
      image: `https://boudoir.barcelona${thumbnailUrl}`,
    },
  ],
};

export default function SessionPreparationPage() {
  return (
    <main className="min-h-screen pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="container mx-auto px-4 py-16">
        <FadeInTitle>
          <p className="text-center text-sm uppercase tracking-[0.3em] text-primary">
            Before we create together
          </p>
          <h1
            className={`${dancingScript.className} mt-4 text-center text-5xl text-foreground md:text-7xl`}
          >
            Prepare for your session
          </h1>
        </FadeInTitle>

        <FadeInTitle duration={2} delay={0.3}>
          <p
            className={`${arefRuqaa.className} mx-auto mt-6 max-w-3xl text-center text-xl text-muted-foreground md:text-2xl`}
          >
            A few simple suggestions to help you arrive feeling comfortable,
            confident, and ready to enjoy the experience.
          </p>
        </FadeInTitle>

        <section
          className="mx-auto mt-16 max-w-5xl"
          aria-labelledby="guides-title"
        >
          <h2
            id="guides-title"
            className={`${arefRuqaa.className} mb-8 text-center text-3xl text-foreground md:text-4xl`}
          >
            Your preparation guide
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {preparationGuides.map((guide) => {
              const Icon = guide.icon;

              return (
                <Card key={guide.title} className="bg-card">
                  <CardContent className="flex gap-5 p-6 md:p-8">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h3
                        className={`${arefRuqaa.className} text-xl font-semibold text-foreground`}
                      >
                        {guide.title}
                      </h3>
                      <p className="mt-3 leading-7 text-muted-foreground">
                        {guide.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section
          className="mx-auto mt-16 max-w-3xl rounded-3xl bg-muted/50 p-8 md:p-12"
          aria-labelledby="checklist-title"
        >
          <div className="text-center">
            <h2
              id="checklist-title"
              className={`${dancingScript.className} text-4xl text-foreground md:text-5xl`}
            >
              The day-of checklist
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              You do not need to bring everything. This is simply a helpful
              reminder of the things that may make your session feel more like
              your own.
            </p>
          </div>
          <ul className="mx-auto mt-8 max-w-xl space-y-4">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-3 text-foreground">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="mx-auto mt-16 max-w-4xl rounded-3xl bg-primary p-8 text-center md:p-12"
          aria-labelledby="reassurance-title"
        >
          <Heart
            className="mx-auto h-8 w-8 text-primary-foreground"
            aria-hidden="true"
          />
          <h2
            id="reassurance-title"
            className={`${dancingScript.className} mt-4 text-4xl text-primary-foreground md:text-5xl`}
          >
            You do not have to know how to pose
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-primary-foreground/90">
            Feeling nervous is completely normal. I will guide you through the
            poses, help you find your best angles, and make sure you feel
            respected and comfortable throughout the session. You only need to
            arrive as yourself.
          </p>
          <Link
            href="/#book-session"
            className="mt-8 inline-block rounded-full bg-background px-8 py-3 font-bold text-foreground transition-all duration-300 hover:scale-105 hover:bg-background/90"
          >
            Let&apos;s plan your session
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/90">
            <Link href="/faq" className="underline underline-offset-4">
              Read the FAQs
            </Link>
            <Link href="/our-process" className="underline underline-offset-4">
              See how the session works
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
