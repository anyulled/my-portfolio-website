"use client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useScroll } from "@/contexts/ScrollContext";
import useAnalyticsEventTracker from "@/hooks/eventTracker";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Dancing_Script } from "next/font/google";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LocaleSwitcher from "@/components/LocaleSwitcher";
import { NavLinks } from "@/components/NavLinks";
import clsx from "clsx";
import { useTranslations } from "next-intl";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const navLinks = [
  { name: "menu_what_is_boudoir", href: "/what-is-boudoir" },
  { name: "menu_about", href: "/about" },
  { name: "menu_testimonials", href: "/testimonials" },
  { name: "menu_myths", href: "/boudoir-myths" },
];

export default function NavBar() {
  //region State
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { lenis } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const gaEventTracker = useAnalyticsEventTracker("Navigation");
  //endregion

  const t = useTranslations();

  useEffect(() => {
    setMounted(true);
    if (!theme) {
      setTheme("light");
    }
  }, [setTheme, theme]);

  useEffect(() => {
    const handleScroll = ({ scroll }: { scroll: number }) => {
      setIsScrolled(scroll > 50);
    };

    if (lenis) {
      lenis.on("scroll", handleScroll);
      setIsScrolled(lenis.scroll > 50);
      return () => {
        lenis.off("scroll", handleScroll);
      };
    }

    const handleWindowScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleWindowScroll);
    handleWindowScroll();
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [lenis]);

  //region Handlers
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
    router.push("/#book-session");
  };
  //endregion

  return (
    <nav
      className={clsx(
        "fixed w-full z-50 transition-all duration-300",
        isScrolled && "bg-opacity-50 backdrop-blur-md",
      )}
    >
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link
          href="/"
          className={clsx(
            `dark:text-foreground text-primary ${dancingScript.className} text-3xl`,
            pathname !== "/" && "text-muted-foreground",
          )}
        >
          Sensuelle Boudoir
        </Link>
        <div className="flex items-center space-x-4">
          <LocaleSwitcher />
          <Button
            className={clsx(
              "ml-0! bg-background text-foreground dark:bg-background",
              pathname === "/" && "bg-transparent!",
            )}
            variant="ghost"
            size="icon"
            onClick={handleThemeChange}
            aria-label={t("nav_bar.toggle_theme")}
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )}
          </Button>
          <div className="hidden md:flex space-x-4 items-center">
            <NavLinks navLinks={navLinks} handleNavClick={handleNavClick} />
          </div>
          <Button
            onClick={handleBookNow}
            className="hidden md:inline-flex bg-primary text-primary-foreground"
          >
            {t("nav_bar.book_now")}
          </Button>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6 dark:text-foreground text-neutral-800" />
                <span className="sr-only">{t("nav_bar.open_menu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className={dancingScript.className}>
                  Sensuelle Boudoir
                </SheetTitle>
                <SheetDescription>
                  {t("nav_bar.capture_your_essence")}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex flex-col space-y-4">
                <NavLinks navLinks={navLinks} handleNavClick={handleNavClick} />
                <Button
                  onClick={handleBookNow}
                  className="mt-4 bg-pantone-fig dark:bg-pantone-fig"
                >
                  {t("nav_bar.book_now")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
