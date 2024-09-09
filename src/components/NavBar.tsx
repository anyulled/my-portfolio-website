"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Dancing_Script } from "next/font/google";
import { useScroll } from "@/contexts/ScrollContext";
import useAnalyticsEventTracker from "@/hooks/eventTracker";

const dancingScript = Dancing_Script({ subsets: ["latin"] });

export default function NavBar() {
  const { theme, setTheme } = useTheme();
  const { scrollY } = useScroll();
  const gaEventTracker = useAnalyticsEventTracker('Navigation');

  const handleThemeChange = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    gaEventTracker('theme_change', newTheme)
  }

  const handleBookNow = () => {
    gaEventTracker('book_now_click', 'navbar')
  }

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
          <Button onClick={handleBookNow} >
            <Link href={"#book-session"}>Book Now</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
