export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
const GA_DEBUG = process.env.NODE_ENV !== "production";

type GtagEventParams = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
};

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID) {
    if (GA_DEBUG) console.warn("GA pageview dropped: missing GA_MEASUREMENT_ID");
    return;
  }
  if (typeof window === "undefined") return;
  if (window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
      debug_mode: GA_DEBUG,
    });
  } else if (GA_DEBUG) {
    console.warn("GA pageview dropped: gtag not ready", { url });
  }
};

export const event = ({ action, category, label, value }: GtagEventParams) => {
  if (!GA_MEASUREMENT_ID) {
    if (GA_DEBUG) console.warn("GA event dropped: missing GA_MEASUREMENT_ID", { action, category, label, value });
    return;
  }
  if (typeof window === "undefined") return;
  if (window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
      debug_mode: GA_DEBUG,
    });
  } else if (GA_DEBUG) {
    console.warn("GA event dropped: gtag not ready", { action, category, label, value });
  }
};
