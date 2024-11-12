import Link from "next/link";
import { useTranslations } from "next-intl";

export const NavLinks = (props: {
  navLinks: {
    name: string;
    href: string;
  }[];
  handleNavClick: (linkName: string) => void;
}) => {
  const t = useTranslations("nav_bar");
  return (
    <>
      {props.navLinks.map((link) => (
        <Link
          key={link.name}
          href={link.href}
          className="text-sm font-medium hover:text-primary transition-colors dark:text-white text-neutral-800"
          onClick={() => props.handleNavClick(link.name)}
        >
          {/* @ts-expect-error i18n issues */}
          {t(link.name)}
        </Link>
      ))}
    </>
  );
};
