/*
 * This file configures the initialization of Sentry on the client for Turbopack compatibility.
 * https://nextjs.org/docs/app/api-reference/config/next-config-js/clientInstrumentationHook
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: "https://bda7397c0d1dddf28eb9395816976184@o194303.ingest.us.sentry.io/4508363952422912",

    // Add optional integrations for additional features
    integrations: [Sentry.replayIntegration()],

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 1,

    /*
     * Define how likely Replay events are sampled.
     * This sets the sample rate to be 10%. You may want this to be 100% while
     * in development and sample at a lower rate in production
     */
    replaysSessionSampleRate: 0.1,

    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
