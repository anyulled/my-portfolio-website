import Link from "next/link";
import { Camera, Instagram, LayoutPanelTop, Twitter, User } from "lucide-react";
import { Aref_Ruqaa } from "next/font/google";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

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
];

export default function SocialMedia() {
  const t = useTranslations("social");
  return (
    <section className="py-16 bg-opacity-75 backdrop-blur-md">
      <div className="container mx-auto px-6">
        <h2
          className={`${arefRuqaa.className} text-3xl font-bold text-center mb-8`}
        >
          {t("connect")}
        </h2>
        <TooltipProvider>
          <div className="flex justify-center space-x-6">
            {socialLinks.map((social) => (
              <Tooltip key={social.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={social.url}
                    className="text-2xl text-peach-fuzz-600 dark:text-peach-fuzz-100 hover:text-peach-fuzz-800 transition-colors"
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
