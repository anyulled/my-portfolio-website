"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { grantConsent } from "@/lib/gtag";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const t = useTranslations("cookie");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("cookieConsent");
      if (!consent) {
        setShowConsent(true);
      }
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
      className={clsx(
        "fixed bottom-0 left-0 right-0 p-2 dark:bg-popover bg-popover/90 bg-opacity-75 backdrop-blur-sm z-50 text-sm transition-all duration-300",
        !showConsent && "hidden",
      )}
    >
      <div className="container mx-auto flex justify-between items-center">
        <p className="dark:text-popover-foreground text-popover-foreground">
          {t("cookie_message")}
        </p>
        <Button
          onClick={handleAccept}
          variant="outline"
          size="sm"
          className="dark:hover:bg-muted dark:text-popover-foreground dark:border-muted hover:bg-muted text-popover-foreground border-border"
        >
          {t("accept")}
        </Button>
      </div>
    </div>
  );
}
