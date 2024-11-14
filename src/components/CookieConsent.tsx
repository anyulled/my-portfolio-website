"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { grantConsent } from "@/lib/gtag";
import { useTranslations } from "next-intl";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const { theme } = useTheme();
  const t = useTranslations("cookie");

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "true");
    grantConsent();
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 p-2 ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} bg-opacity-75 backdrop-blur-sm z-50 text-sm transition-all duration-300 ${showConsent ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <p className="dark:text-gray-300 text-neutral-800">
          {t("cookie_message")}
        </p>
        <Button
          onClick={handleAccept}
          variant="outline"
          size="sm"
          className="dark:hover:bg-gray-700 hover:bg-gray-200 dark:text-gray-300 text-neutral-800"
        >
          {t("accept")}
        </Button>
      </div>
    </div>
  );
}
