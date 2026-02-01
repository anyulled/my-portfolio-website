import { useTranslations } from "next-intl";
import Link from "next/link";
import { memo } from "react";

export const NavLinks = memo(
  (props: {
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
            {((key: string) => t(key))(link.name)}
          </Link>
        ))}
      </>
    );
  },
);
NavLinks.displayName = "NavLinks";
