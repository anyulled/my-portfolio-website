"use client";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import React from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { ScrollProvider } from "@/contexts/ScrollContext";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsent from "@/components/CookieConsent";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Boudoir Barcelona</title>
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ScrollProvider>
            <div className={`min-h-screen`}>
              <NavBar />
              {children}
            </div>
            <Toaster />
            <CookieConsent />
          </ScrollProvider>
        </ThemeProvider>
        <Footer />

        <div
          className="fixed inset-0 pointer-events-none z-50 opacity-10"
          style={{
            backgroundImage: "url('/api/placeholder?height=200&width=200')",
            backgroundRepeat: "repeat",
            mixBlendMode: "overlay",
          }}
        />
        <SpeedInsights />
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
