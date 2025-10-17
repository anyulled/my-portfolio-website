import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
export const initMixpanel = () => {
  if (MIXPANEL_TOKEN) {
    mixpanel.init(MIXPANEL_TOKEN, {
      autocapture: true,
      debug: process.env.NODE_ENV !== "production"
    });
  } else if (process.env.NODE_ENV !== "production") {
    console.warn("Mixpanel token is missing! Check your .env file.");
  }
};