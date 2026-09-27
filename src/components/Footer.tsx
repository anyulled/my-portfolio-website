import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { getProfessionalPortfolioCopy } from "@/lib/professionalPortfolioCopy";
import type { Locale } from "@/i18n/config";

const footerLinks = [
  { name: "privacy", href: "/privacy" },
  { name: "cookies", href: "/cookies" },
  { name: "legal", href: "/legal" },
];

const siteLinks = [
  { name: "about", href: "/about" },
  { name: "pricing", href: "/pricing" },
  { name: "testimonials", href: "/testimonials" },
  { name: "styles", href: "/styles" },
  { name: "faq", href: "/faq" },
  { name: "session_preparation", href: "/session-preparation" },
  { name: "photography_release", href: "/photography-release" },
  { name: "model_release", href: "/model-release" },
];

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale() as Locale;
  const portfolioCopy = getProfessionalPortfolioCopy(locale);
  return (
    <footer className="bg-muted dark:bg-muted/10 border-t">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center">
          <nav className="flex flex-wrap justify-center gap-4 mb-4">
            {siteLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {((key: string) => t(key))(link.name)}
              </Link>
            ))}
          </nav>
          <nav className="mb-4 flex flex-wrap justify-center gap-4">
            <Link
              href="/professional-portfolio-photography"
              className="text-sm text-primary underline"
            >
              {portfolioCopy.title}
            </Link>
            <a
              href="https://g.page/r/CXYGEWUyinIwEBM/review"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline"
            >
              {portfolioCopy.reviews}
            </a>
          </nav>
          <nav className="flex flex-wrap justify-center gap-4 mb-4">
            {footerLinks.map((link) => (
              <Link key={link.name} href={link.href} className="text-sm">
                {((key: string) => t(key))(link.name)}
              </Link>
            ))}
          </nav>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Sensuelle Boudoir.{" "}
            {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
