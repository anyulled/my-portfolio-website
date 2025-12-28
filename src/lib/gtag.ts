export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

// https://developers.google.com/tag-platform/security/guides/consent?consentmode=basic
export const pageview = (url: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).gtag("config", GA_TRACKING_ID, {
    page_path: url,
  });
};

export const submitLeadForm = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).gtag("event", "conversion", {
    send_to: "AW-16670888958/QwUCCMzUnNUZEP6npo0-",
  });
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

export const grantConsent = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).gtag("consent", "update", {
    ad_user_data: "granted",
    ad_personalization: "granted",
    ad_storage: "granted",
    analytics_storage: "granted",
  });
};
