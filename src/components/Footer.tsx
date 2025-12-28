import { useTranslations } from "next-intl";
import Link from "next/link";

const footerLinks = [
  { name: "privacy", href: "/privacy" },
  { name: "cookies", href: "/cookies" },
  { name: "legal", href: "/legal" },
];

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="bg-muted dark:bg-muted/10 border-t">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center">
          <nav className="flex flex-wrap justify-center gap-4 mb-4">
            {footerLinks.map((link) => (
              <Link key={link.name} href={link.href} className="text-sm">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {t(link.name as any)}
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
