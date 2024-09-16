import Link from "next/link";

const footerLinks = [
  { name: "Privacy Terms", href: "/privacy" },
  { name: "Cookies", href: "/cookies" },
  { name: "Legal Terms", href: "/legal" },
];

export default function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center">
          <nav className="flex flex-wrap justify-center gap-4 mb-4">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sensuelle Boudoir. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
