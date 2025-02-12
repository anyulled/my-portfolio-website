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
import { Metadata } from "next";
import { openGraph } from "@/lib/openGraph";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export const metadata: Metadata = {
  metadataBase: new URL("https://boudoir.barcelona"),
  title: {
    template: "%s · Boudoir Photography in Barcelona",
    default: "Sensuelle Boudoir · Boudoir Photography in Barcelona",
  },
  description: "Boudoir photography service in Barcelona.",
  openGraph: openGraph,
  twitter: {
    card: "summary_large_image",
    title: {
      template: "%s · Boudoir Photography in Barcelona",
      default: "Sensuelle Boudoir · Boudoir Photography in Barcelona",
    },
    description: "Boudoir photography service in Barcelona.",
    images: [
      "https://live.staticflickr.com/65535/53367295647_2ff0fdf881_h.jpg",
    ],
    site: "@anyulled",
    creator: "@anyulled",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={"bg-neutral-50 dark:bg-zinc-800"}>
        <NextIntlClientProvider messages={messages}>
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
          <SpeedInsights />
          <Analytics />
          <GoogleAnalytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
