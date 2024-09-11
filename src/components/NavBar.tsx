"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Dancing_Script } from "next/font/google";
import { useScroll } from "@/contexts/ScrollContext";
import useAnalyticsEventTracker from "@/hooks/eventTracker";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {useRouter} from "next/navigation";

const dancingScript = Dancing_Script({ subsets: ["latin"] });

const navLinks = [
  { name: "About Me", href: "/about" },
  { name: "Privacy Terms", href: "/privacy" },
  { name: "Cookies", href: "/cookies" },
  { name: "Legal Terms", href: "/legal" },
];

export default function NavBar() {
  const { theme, setTheme } = useTheme();
  const { scrollY } = useScroll();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const gaEventTracker = useAnalyticsEventTracker("Navigation");

  const handleThemeChange = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    gaEventTracker("theme_change", newTheme);
  };

  const handleNavClick = (linkName: string) => {
    gaEventTracker("nav_link_click", linkName);
    setIsOpen(false);
  };

  const handleBookNow = () => {
    gaEventTracker("book_now_click", "navbar");
    router.push("/#book-session")
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${scrollY > 50 ? "bg-opacity-50 backdrop-blur-md" : ""}`}
    >
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/" className={`${dancingScript.className} text-3xl`}>
          Sensuelle Boudoir
        </Link>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeChange}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )}
          </Button>
          <div className="hidden md:flex space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => handleNavClick(link.name)}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <Button onClick={handleBookNow} className="hidden md:inline-flex">
            Book Now
          </Button>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className={dancingScript.className}>
                  Sensuelle Boudoir
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => handleNavClick(link.name)}
                  >
                    {link.name}
                  </Link>
                ))}
                <Button onClick={handleBookNow} className="mt-4">
                  Book Now
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
