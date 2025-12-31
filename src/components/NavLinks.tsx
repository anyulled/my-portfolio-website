import { useTranslations } from "next-intl";
import Link from "next/link";

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
          className="text-sm font-medium hover:text-primary transition-colors dark:text-foreground text-foreground"
          onClick={() => props.handleNavClick(link.name)}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {t(link.name as any)}
        </Link>
      ))}
    </>
  );
};
