import Link from "next/link";
import {
  Bird,
  Camera,
  Instagram,
  LayoutPanelTop,
  Twitter,
  User
} from "lucide-react";
import { Aref_Ruqaa } from "next/font/google";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
import FadeInTitle from "@/components/FadeInTitle";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

const socialLinks = [
  { name: "Twitter", icon: Twitter, url: "https://twitter.com/anyulled" },
  {
    name: "Instagram",
    icon: Instagram,
    url: "https://instagram.com/sensuelleboudoir",
  },
  { name: "Flickr", icon: Camera, url: "https://flickr.com/people/anyulled" },
  { name: "Kavyar", icon: LayoutPanelTop, url: "https://kavyar.com/anyulled" },
  { name: "Model Mayhem", icon: User, url: "https://modelmayhem.com/anyulled" },
  {
    name: "Bluesky",
    icon: Bird,
    url: "https://bsky.app/profile/sensuelle-boudoir.bsky.social",
  },
];

export default function SocialMedia() {
  const t = useTranslations("social");
  return (
    <section className="my-6 bg-opacity-75 backdrop-blur-md">
      <div className="container mx-auto px-6">
        <FadeInTitle>
        <h2
          className={`${arefRuqaa.className} text-3xl font-bold text-center mb-8`}
        >
          {t("connect")}
        </h2>
        </FadeInTitle>
        <TooltipProvider>
          <div className="flex justify-center space-x-6">
            {socialLinks.map((social) => (
              <Tooltip key={social.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={social.url}
                    className="text-2xl text-mocha-mousse-600 dark:text-mocha-mousse-100 hover:text-mocha-mousse-800 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon />
                    <span className="sr-only">{social.name}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{`${t("follow_us")} ${social.name}`}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </div>
    </section>
  );
}
