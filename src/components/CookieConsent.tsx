"use client";

import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {grantConsent} from "@/lib/gtag";
import {useTranslations} from "next-intl";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
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
        className={`fixed bottom-0 left-0 right-0 p-2 dark:bg-mocha-mousse-800 bg-mocha-mousse-100 bg-opacity-75 backdrop-blur-sm z-50 text-sm transition-all duration-300 ${showConsent ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <p className="dark:text-mocha-mousse-200 text-mocha-mousse-800">
          {t("cookie_message")}
        </p>
        <Button
          onClick={handleAccept}
          variant="outline"
          size="sm"
          className="dark:hover:bg-mocha-mousse-700 dark:text-mocha-mousse-200 dark:border-mocha-mousse-700 hover:bg-mocha-mousse-200  text-mocha-mousse-800 border-mocha-mousse-200"
        >
          {t("accept")}
        </Button>
      </div>
    </div>
  );
}
