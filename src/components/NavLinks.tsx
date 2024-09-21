import Link from "next/link";

export const NavLinks = (props: {
  navLinks: {
    name: string;
    href: string;
  }[];
  handleNavClick: (linkName: string) => void;
}) => (
  <>
    {props.navLinks.map((link) => (
      <Link
        key={link.name}
        href={link.href}
        className="text-sm font-medium hover:text-primary transition-colors dark:text-white text-neutral-800"
        onClick={() => props.handleNavClick(link.name)}
      >
        {link.name}
      </Link>
    ))}
  </>
);