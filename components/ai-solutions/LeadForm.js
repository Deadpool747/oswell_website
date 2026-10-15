"use client";

import { useEffect, useRef, useState } from "react";
import { trackMarketingEvent } from "./AnalyticsConsent";

const INITIAL_STATE = {
  fullName: "",
  email: "",
  company: "",
  industry: "",
  objective: "",
  phone: "",
  website: "",
  details: "",
  consent: false,
  companyAddress: "",
};

function getAttribution(campaignVariant) {
  const params = new URLSearchParams(window.location.search);
  return {
    sourcePlatform: params.get("utm_source") || "direct",
    campaign: params.get("utm_campaign") || "",
    campaignVariant,
    landingPage: window.location.href.split("#")[0],
    utm: {
      source: params.get("utm_source") || "",
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || "",
      content: params.get("utm_content") || "",
      term: params.get("utm_term") || "",
    },
    clickIds: {
      gclid: params.get("gclid") || "",
      fbclid: params.get("fbclid") || "",
      liFatId: params.get("li_fat_id") || "",
    },
  };
}

export function LeadForm({ campaignVariant }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const started = useRef(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  function onChange(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    if (!started.current) {
      started.current = true;
      trackMarketingEvent("form_start", { campaign_variant: campaignVariant });
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    setStatus({ type: "loading", message: "Sending your request securely…" });

    try {
      const response = await fetch("/api/leads/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-oswell-form": "ai-consultation" },
        body: JSON.stringify({ ...form, ...getAttribution(campaignVariant), formElapsedMs: Date.now() - startedAt.current }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "We could not send your request.");

      window.sessionStorage.setItem("oswell_confirmed_lead", JSON.stringify({ leadId: result.leadId, campaignVariant }));
      trackMarketingEvent("generate_lead", { campaign_variant: campaignVariant, lead_id: result.leadId });
      setStatus({ type: "success", message: "Received. Taking you to the next step…" });
      window.setTimeout(() => window.location.assign("/thank-you/"), 350);
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Something went wrong. Please try again." });
    }
  }

  return (
    <form className="ai-lead-form" onSubmit={onSubmit}>
      <div className="ai-field-grid">
        <label className="ai-field">
          <span>Full name *</span>
          <input name="fullName" value={form.fullName} onChange={onChange} autoComplete="name" required minLength={2} />
        </label>
        <label className="ai-field">
          <span>Work email *</span>
          <input type="email" name="email" value={form.email} onChange={onChange} autoComplete="email" required />
        </label>
        <label className="ai-field">
          <span>Company name *</span>
          <input name="company" value={form.company} onChange={onChange} autoComplete="organization" required minLength={2} />
        </label>
        <label className="ai-field">
          <span>Industry *</span>
          <select name="industry" value={form.industry} onChange={onChange} required>
            <option value="">Select your industry</option>
            <option>Healthcare</option><option>Manufacturing</option><option>Logistics</option>
            <option>Professional Services</option><option>Retail</option><option>Education</option><option>Other</option>
          </select>
        </label>
      </div>
      <label className="ai-field">
        <span>What would you like to achieve? *</span>
        <select name="objective" value={form.objective} onChange={onChange} required>
          <option value="">Select a business objective</option>
          <option>Automate repetitive processes</option><option>Implement AI agents</option>
          <option>Deploy AI voice agents</option><option>Build custom software</option>
          <option>Integrate existing business systems</option><option>Explore AI opportunities</option><option>Other</option>
        </select>
      </label>
      <div className="ai-field-grid">
        <label className="ai-field">
          <span>Phone number <small>Optional</small></span>
          <input type="tel" name="phone" value={form.phone} onChange={onChange} autoComplete="tel" placeholder="Include country code" />
        </label>
        <label className="ai-field">
          <span>Company website <small>Optional</small></span>
          <input type="url" name="website" value={form.website} onChange={onChange} autoComplete="url" placeholder="https://" />
        </label>
      </div>
      <label className="ai-field">
        <span>Additional project details <small>Optional</small></span>
        <textarea name="details" value={form.details} onChange={onChange} rows={4} maxLength={3000} placeholder="Tell us where the bottleneck is today and what a better outcome looks like." />
      </label>
      <label className="ai-honeypot" aria-hidden="true">
        Company address<input name="companyAddress" value={form.companyAddress} onChange={onChange} tabIndex={-1} autoComplete="off" />
      </label>
      <label className="ai-check">
        <input type="checkbox" name="consent" checked={form.consent} onChange={onChange} required />
        <span>I agree that Oswell Technologies may use these details to respond to my enquiry. See the <a href="/privacy/" target="_blank">privacy notice</a>.</span>
      </label>
      <button className="ai-button ai-button-primary ai-submit" type="submit" disabled={status.type === "loading"}>
        {status.type === "loading" ? "Sending…" : "Get My Free AI Consultation"}
      </button>
      <p className={`ai-form-status is-${status.type}`} role="status" aria-live="polite">{status.message}</p>
      <p className="ai-form-note">No obligation. We review every request before recommending a practical next step.</p>
    </form>
  );
}
