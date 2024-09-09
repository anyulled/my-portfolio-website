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
import {Metadata} from "next";

export const metadata: Metadata = {
  title: "Sensuelle Boudoir · Boudoir Photography in Barcelona",
  description: "Boudoir photography service in Barcelona.",
  openGraph: {
    title: "Sensuelle Boudoir",
    description: "Boudoir photography service in Barcelona.",
    url: "https://boudoir.barcelona",
    siteName: "Boudoir photography service in Barcelona",
    images: [
      {
        url: "https://live.staticflickr.com/65535/53367295647_2ff0fdf881_h.jpg",
        width: 1200,
        height: 630,
        alt: "Boudoir photography in Barcelona",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sensuelle Boudoir",
    description: "Boudoir photography service in Barcelonas.",
    images: ["https://live.staticflickr.com/65535/53367295647_2ff0fdf881_h.jpg"],
    site: "@anyulled",
    creator: "@anyulled",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
