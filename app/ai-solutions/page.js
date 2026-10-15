import { AiSolutionsLanding } from "@/components/ai-solutions/AiSolutionsLanding";
import { DEFAULT_AI_CAMPAIGN } from "@/lib/ai-campaigns";

export const metadata = {
  title: "Custom AI Development & Business Automation | Oswell Technologies",
  description:
    "Custom AI agents, intelligent automation, and enterprise software built around your business operations.",
  alternates: {
    canonical: "https://oswelltechnologies.com/ai-solutions/",
  },
  openGraph: {
    title: "Automate Operations. Reduce Costs. Scale Smarter.",
    description: "Custom AI development and business automation from Oswell Technologies.",
    url: "https://oswelltechnologies.com/ai-solutions/",
    siteName: "Oswell Technologies",
    type: "website",
    images: [{ url: "/og.png", width: 1734, height: 907, alt: "Automate Operations. Reduce Costs. Scale Smarter." }],
  },
  twitter: { card: "summary_large_image", title: "Automate Operations. Reduce Costs. Scale Smarter.", description: "Custom AI development and business automation from Oswell Technologies.", images: ["/og.png"] },
};

export default function AiSolutionsPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Custom AI Development & Business Automation",
    provider: { "@type": "Organization", name: "Oswell Technologies", url: "https://oswelltechnologies.com" },
    areaServed: ["United States", "United Kingdom", "India"],
    serviceType: ["AI Development", "Business Automation", "Custom Software Development"],
    url: "https://oswelltechnologies.com/ai-solutions/",
  };
  return <><AiSolutionsLanding campaign={DEFAULT_AI_CAMPAIGN} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /></>;
}
