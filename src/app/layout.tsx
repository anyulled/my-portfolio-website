import "./globals.css";
import {ThemeProvider} from "next-themes";
import React from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import {ScrollProvider} from "@/contexts/ScrollContext";
import {Toaster} from "@/components/ui/toaster";
import {SpeedInsights} from "@vercel/speed-insights/next";
import {Analytics} from "@vercel/analytics/react";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsent from "@/components/CookieConsent";
import {Metadata} from "next";
import {openGraph} from "@/lib/openGraph";
import {NextIntlClientProvider} from "next-intl";
import {getLocale, getMessages} from "next-intl/server";
import {LocalBusiness, WithContext} from "schema-dts";

export const metadata: Metadata = {
    metadataBase: new URL("https://boudoir.barcelona"),
    title: {
        template: "%s · Boudoir Photography in Barcelona",
        default: "Sensuelle Boudoir · Boudoir Photography in Barcelona"
    },
    keywords:
        "boudoir photography, client reviews, empowering photography, confidence boost, feminine portraits, professional photography, boudoir barcelona",
    description: "Boudoir photography service in Barcelona.",
    openGraph: openGraph,
    twitter: {
        card: "summary_large_image",
        title: {
            template: "%s · Boudoir Photography in Barcelona",
            default: "Sensuelle Boudoir · Boudoir Photography in Barcelona"
        },
        description: "Boudoir photography service in Barcelona.",
        images: [
            "https://live.staticflickr.com/65535/53367295647_2ff0fdf881_h.jpg"
        ],
        site: "@anyulled",
        creator: "@anyulled"
    },
};

const structuredData: WithContext<LocalBusiness> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Sensuelle Boudoir",
    image: "https://boudoir.barcelona/logo.png",
    description:
        "Professional Boudoir photography service in Barcelona. Services include boudoir sessions for women, bridal boudoir, and couple shoots.",
    url: "https://boudoir.barcelona",
    telephone: "+34 638 802 609",
    email: "info@boudoir.barcelona",
    address: {
        "@type": "PostalAddress",
        streetAddress: "Ctra. del Mig, 76",
        addressLocality: "L'Hospitalet de Llobregat",
        postalCode: "08907",
        addressRegion: "Barcelona",
        addressCountry: "ES"
    },
    geo: {
        "@type": "GeoCoordinates",
        latitude: 41.35719313051415,
        longitude: 2.109886835540104
    },
    openingHoursSpecification: [
        {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ],
            opens: "09:00",
            closes: "20:00"
        },
    ],
    sameAs: ["https://www.instagram.com/sensuelleboudoir"],
    priceRange: "$$$$",
    areaServed: {
        "@type": "Place",
        address: {
            "@type": "PostalAddress",
            addressRegion: "Barcelona",
            addressCountry: "ES"
        },
    },
    paymentAccepted: "Cash, Credit Card, Bank Transfer, Paypal, Bizum",
    hasMap:
        "https://www.google.com/maps/search/?api=1&query=41.35719313051415,2.109886835540104",
    isAccessibleForFree: false,
    founder: {
        "@type": "Person",
        name: "Anyul Rivas"
    },
    foundingDate: "2022-01-01",
    makesOffer: [
        {
            "@type": "Offer",
            itemOffered: {
                "@type": "Service",
                name: "Boudoir Photography Session",
                category: "Boudoir",
                serviceType: "Photography"
            },
        },
        {
            "@type": "Offer",
            itemOffered: {
                "@type": "Service",
                name: "Bridal Boudoir",
                category: "Wedding",
                serviceType: "Photography"
            },
        },
        {
            "@type": "Offer",
            itemOffered: {
                "@type": "Service",
                name: "Couple Boudoir Session",
                category: "Couples",
                serviceType: "Photography"
            },
        },
    ],
};

export default async function RootLayout({
                                             children
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();
    const messages = await getMessages();
    return (
        <html lang={locale} suppressHydrationWarning>
        <body className={"bg-mocha-mousse-50 dark:bg-mocha-mousse-900"}>
        <NextIntlClientProvider messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <ScrollProvider>
                    <div
                        className="min-h-screen bg-mocha-mousse-50 text-mocha-mousse-800 dark:bg-mocha-mousse-900 dark:text-mocha-mousse-100">
                        <NavBar/>
                        {children}
                    </div>
                    <Toaster/>
                    <CookieConsent/>
                </ScrollProvider>
            </ThemeProvider>
            <Footer/>
            <SpeedInsights/>
            <Analytics/>
            <GoogleAnalytics/>
        </NextIntlClientProvider>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}}
        />
        </body>
        </html>
    );
}
