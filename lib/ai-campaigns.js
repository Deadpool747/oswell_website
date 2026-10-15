export const AI_CAMPAIGNS = {
  "ai-development": {
    label: "Google Ads · AI Development",
    headline: "Custom AI Development for Growing Businesses",
    emphasis: "Turn high-value workflows into secure, practical AI systems built around your business.",
  },
  "business-automation": {
    label: "Google Ads · Business Automation",
    headline: "Automate Business Processes With Custom AI Solutions",
    emphasis: "Remove repetitive operational work without replacing the systems your teams already rely on.",
  },
  healthcare: {
    label: "LinkedIn · Healthcare",
    headline: "Reduce Healthcare Administrative Work With AI",
    emphasis: "Improve patient coordination and reduce repetitive admin while keeping people in control.",
  },
  manufacturing: {
    label: "LinkedIn · Manufacturing",
    headline: "Smarter Manufacturing Operations With AI & Automation",
    emphasis: "Connect reporting, documentation, maintenance, and operational insight in one practical workflow layer.",
  },
  logistics: {
    label: "LinkedIn · Logistics",
    headline: "Automate Logistics Workflows and Customer Communication",
    emphasis: "Keep shipment communication, documentation, dispatch, and exception handling moving with less manual work.",
  },
  "voice-agents": {
    label: "Meta · AI Voice Agents",
    headline: "AI Voice Agents That Talk, Understand & Take Action",
    emphasis: "Handle enquiries, qualification, scheduling, follow-ups, and approved system actions through natural conversations.",
  },
};

export const DEFAULT_AI_CAMPAIGN = {
  slug: "general",
  label: "Custom AI development & business automation",
  headline: "Automate Operations. Reduce Costs. Scale Smarter.",
  emphasis:
    "We build custom AI agents, intelligent automation, and enterprise software that help businesses eliminate repetitive work, improve efficiency, and accelerate growth.",
};

export function getAiCampaign(slug) {
  const campaign = AI_CAMPAIGNS[slug];
  return campaign ? { slug, ...campaign } : null;
}
