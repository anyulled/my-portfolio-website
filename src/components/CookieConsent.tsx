"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      const timer = setTimeout(() => setShowConsent(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "true");
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 p-2 ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} bg-opacity-75 backdrop-blur-sm z-50 text-sm transition-all duration-300 ${showConsent ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <p
          className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
        >
          We use cookies to enhance your experience. By continuing to visit this
          site you agree to our use of cookies.
        </p>
        <Button
          onClick={handleAccept}
          variant="outline"
          size="sm"
          className={`ml-4 ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
