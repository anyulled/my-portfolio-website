import { useTranslations } from "next-intl";
import Link from "next/link";

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
];

export default function Footer() {
  const t = useTranslations("footer");
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
