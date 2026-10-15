"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "oswell_marketing_consent";

function addScript(id, src, inline) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  if (src) {
    script.src = src;
    script.async = true;
  } else {
    script.text = inline;
  }
  document.head.appendChild(script);
}

function loadTracking() {
  const ga4 = process.env.NEXT_PUBLIC_GA4_ID || "G-RNRX7NH07X";
  const gtm = process.env.NEXT_PUBLIC_GTM_ID;
  const googleAds = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const meta = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const linkedIn = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;

  window.dataLayer = window.dataLayer || [];
  if (gtm) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    addScript("oswell-gtm", `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtm)}`);
  } else if (ga4) {
    addScript("oswell-ga", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`);
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", ga4, { anonymize_ip: true, send_page_view: false });
    if (googleAds) window.gtag("config", googleAds);
  }

  if (meta) {
    addScript("oswell-meta", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq = window.fbq || function fbq() { window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments); };
    window.fbq.queue = window.fbq.queue || [];
    window.fbq.loaded = true;
    window.fbq.version = "2.0";
    window.fbq("init", meta);
  }

  if (linkedIn) {
    window._linkedin_partner_id = linkedIn;
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(linkedIn);
    addScript("oswell-linkedin", "https://snap.licdn.com/li.lms-analytics/insight.min.js");
  }
}

export function trackMarketingEvent(eventName, details = {}) {
  if (typeof window === "undefined") return;
  const payload = {
    event: eventName,
    event_category: "ai_lead_generation",
    ...details,
  };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  window.gtag?.("event", eventName, details);
  if (eventName === "generate_lead" && process.env.NEXT_PUBLIC_GOOGLE_ADS_ID && process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL) {
    window.gtag?.("event", "conversion", { send_to: `${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}/${process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL}`, transaction_id: details.lead_id });
  }
  if (eventName === "generate_lead") window.fbq?.("track", "Lead", { content_name: details.campaign_variant });
  if (eventName === "page_view") window.fbq?.("track", "PageView");
  if (eventName === "generate_lead" && process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_ID) {
    window.lintrk?.("track", { conversion_id: Number(process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_ID) });
  }
  window.dispatchEvent(new CustomEvent("oswell:analytics", { detail: payload }));
}

export function AnalyticsConsent({ campaignVariant }) {
  const [consent, setConsent] = useState(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY);
    setConsent(saved);
    if (saved === "granted") {
      loadTracking();
      trackMarketingEvent("page_view", { campaign_variant: campaignVariant });
    }
  }, [campaignVariant]);

  function choose(value) {
    window.localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
    if (value === "granted") {
      loadTracking();
      trackMarketingEvent("page_view", { campaign_variant: campaignVariant });
    }
  }

  if (consent) return null;

  return (
    <aside className="ai-consent" aria-label="Analytics consent">
      <p>We use optional analytics to understand campaign performance. We never send your form details to advertising platforms.</p>
      <div>
        <button type="button" onClick={() => choose("denied")}>Decline</button>
        <button type="button" className="is-primary" onClick={() => choose("granted")}>Allow analytics</button>
      </div>
    </aside>
  );
}
