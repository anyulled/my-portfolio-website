"use client";

import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Analytics wrapper component that loads analytics scripts with optimal strategy.
 * Uses Script component with afterInteractive strategy to avoid blocking initial page load.
 */
export default function Analytics() {
    return (
        <>
            <SpeedInsights />
            <VercelAnalytics />
            <GoogleAnalytics />
            {/* Mixpanel is loaded via MixpanelLayout which wraps children */}
        </>
    );
}
