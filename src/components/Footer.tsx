import Link from "next/link";
import { useTranslations } from "next-intl";

const footerLinks = [
  { name: "privacy", href: "/privacy" },
  { name: "cookies", href: "/cookies" },
  { name: "legal", href: "/legal" },
];

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="bg-mocha-mousse-50 border-t">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center">
          <nav className="flex flex-wrap justify-center gap-4 mb-4">
            {footerLinks.map((link) => (
              <Link key={link.name} href={link.href} className="text-sm">
                {/* @ts-expect-error i18n issues */}
                {t(link.name)}
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
