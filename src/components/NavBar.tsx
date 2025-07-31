"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Dancing_Script } from "next/font/google";
import { useScroll } from "@/contexts/ScrollContext";
import useAnalyticsEventTracker from "@/hooks/eventTracker";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

import { NavLinks } from "@/components/NavLinks";
import { useTranslations } from "next-intl";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import chalk from "chalk";
import clsx from "clsx";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
const navLinks = [
  { name: "menu_what_is_boudoir", href: "/what-is-boudoir" },
  { name: "menu_about", href: "/about" },
  { name: "menu_testimonials", href: "/testimonials" }
];

export default function NavBar() {
  //region State
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { scrollY } = useScroll();
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
    console.log(chalk.cyan(`Current theme: ${theme}`));
  }, [setTheme, theme]);

  if (!mounted) {
    return null;
  }

  //region Handlers
  const handleThemeChange = () => {
    console.log(chalk.cyan(`Theme change: ${theme}`));
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
        scrollY > 50 && "bg-opacity-50 backdrop-blur-md"
      )}
    >
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link
          href="/"
          className={clsx(
            `dark:text-mocha-mousse-50 text-mocha-mousse-200 ${dancingScript.className} text-3xl`,
            pathname !== "/" && "text-mocha-mousse-400",
          )}
        >
          Sensuelle Boudoir
        </Link>
        <div className="flex items-center space-x-4">
          <LocaleSwitcher />
          <Button
            className={clsx(
              "!ml-0 bg-mocha-mousse-50 text-mocha-mousse-500 dark:bg-mocha-mousse-900",
              pathname === "/" && "!bg-transparent",
            )}
            variant="ghost"
            size="icon"
            onClick={handleThemeChange}
            aria-label={t("nav_bar.toggle_theme")}
          >
            {theme === "dark" ? (
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
            className="hidden md:inline-flex bg-mocha-mousse-400 text-mocha-mousse-50"
          >
            {t("nav_bar.book_now")}
          </Button>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6 dark:text-mocha-mousse-50 text-neutral-800" />
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
                  className="mt-4 bg-mocha-mousse-400 dark:bg-mocha-mousse-700"
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
