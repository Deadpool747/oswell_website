import { createHash, randomUUID } from "node:crypto";

export const runtime = "nodejs";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map();

function clean(value, maxLength = 500) {
  return String(value || "").replace(/[<>\u0000-\u001F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function getClientKey(request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  return createHash("sha256").update(`${ip}:${process.env.LEAD_RATE_LIMIT_SALT || "oswell"}`).digest("hex");
}

function isRateLimited(key) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  attempts.set(key, recent);
  return recent.length > MAX_ATTEMPTS;
}

function isAllowedOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const requestOrigin = new URL(request.url).origin;
  const extra = (process.env.ALLOWED_FORM_ORIGINS || "https://oswelltechnologies.com")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return origin === requestOrigin || extra.includes(origin);
}

function validate(body) {
  const errors = {};
  const fullName = clean(body.fullName, 120);
  const email = clean(body.email, 180).toLowerCase();
  const company = clean(body.company, 180);
  const industry = clean(body.industry, 100);
  const objective = clean(body.objective, 180);
  if (fullName.length < 2) errors.fullName = "Please enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid work email.";
  if (company.length < 2) errors.company = "Please enter your company name.";
  if (!industry) errors.industry = "Please select an industry.";
  if (!objective) errors.objective = "Please select a business objective.";
  if (body.consent !== true) errors.consent = "Consent is required so we can respond.";

  const website = clean(body.website, 300);
  if (website) {
    try {
      const parsed = new URL(website);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("invalid");
    } catch {
      errors.website = "Please enter a complete website URL.";
    }
  }
  return { errors, data: { fullName, email, company, industry, objective, website } };
}

async function deliverLead(lead) {
  const crmWebhook = process.env.CRM_WEBHOOK_URL;
  const crmToken = process.env.CRM_WEBHOOK_TOKEN;
  if (!crmWebhook || !crmToken) throw new Error("CRM lead delivery is not configured.");

  const response = await fetch(crmWebhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${crmToken}`,
    },
    body: JSON.stringify(lead),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`CRM lead delivery returned ${response.status}.`);

  if (process.env.LEAD_NOTIFICATION_WEBHOOK_URL) {
    await fetch(process.env.LEAD_NOTIFICATION_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.leadId, company: lead.company, objective: lead.objective, submittedAt: lead.submittedAt }),
      cache: "no-store",
    }).catch(() => null);
  }
}

export async function POST(request) {
  if (!isAllowedOrigin(request) || request.headers.get("x-oswell-form") !== "ai-consultation") {
    return Response.json({ message: "This request could not be verified." }, { status: 403 });
  }
  if (isRateLimited(getClientKey(request))) {
    return Response.json({ message: "Too many attempts. Please wait before trying again." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request." }, { status: 400 });
  }

  if (clean(body.companyAddress, 200) || Number(body.formElapsedMs) < 1200) {
    return Response.json({ leadId: randomUUID(), accepted: true });
  }

  const { errors, data } = validate(body);
  if (Object.keys(errors).length) {
    return Response.json({ message: Object.values(errors)[0], errors }, { status: 400 });
  }

  const lead = {
    leadId: randomUUID(),
    name: data.fullName,
    email: data.email,
    company: data.company,
    industry: data.industry,
    phone: clean(body.phone, 80),
    website: data.website,
    businessRequirement: data.objective,
    projectDetails: clean(body.details, 3000),
    sourcePlatform: clean(body.sourcePlatform, 100),
    campaign: clean(body.campaign, 180),
    landingPageVariant: clean(body.campaignVariant, 100) || "general",
    landingPageUrl: clean(body.landingPage, 600),
    attribution: {
      utmSource: clean(body.utm?.source, 160),
      utmMedium: clean(body.utm?.medium, 160),
      utmCampaign: clean(body.utm?.campaign, 180),
      utmContent: clean(body.utm?.content, 180),
      utmTerm: clean(body.utm?.term, 180),
      gclid: clean(body.clickIds?.gclid, 300),
      fbclid: clean(body.clickIds?.fbclid, 300),
      liFatId: clean(body.clickIds?.liFatId, 300),
    },
    leadStatus: "New",
    assignedSalesRepresentative: "",
    followUpStatus: "Pending",
    submittedAt: new Date().toISOString(),
    _subject: `New AI consultation request — ${data.company}`,
  };

  try {
    await deliverLead(lead);
    return Response.json({ leadId: lead.leadId, accepted: true }, { status: 201 });
  } catch {
    return Response.json({ message: "We could not securely deliver your request. Please try again or book a call." }, { status: 503 });
  }
}

export function GET() {
  return Response.json({
    status: "ready",
    destination: "Oswell Sales Agent",
    configured: Boolean(process.env.CRM_WEBHOOK_URL && process.env.CRM_WEBHOOK_TOKEN),
  });
}
