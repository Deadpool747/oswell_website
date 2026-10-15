import { notFound } from "next/navigation";
import { AiSolutionsLanding } from "@/components/ai-solutions/AiSolutionsLanding";
import { AI_CAMPAIGNS, getAiCampaign } from "@/lib/ai-campaigns";

export function generateStaticParams() {
  return Object.keys(AI_CAMPAIGNS).map((variant) => ({ variant }));
}

export async function generateMetadata({ params }) {
  const { variant } = await params;
  const campaign = getAiCampaign(variant);
  if (!campaign) return {};
  return {
    title: `${campaign.headline} | Oswell Technologies`,
    description: campaign.emphasis,
    alternates: { canonical: "https://oswelltechnologies.com/ai-solutions/" },
    robots: { index: false, follow: true },
    openGraph: { title: campaign.headline, description: campaign.emphasis, url: `https://oswelltechnologies.com/ai-solutions/${variant}/`, siteName: "Oswell Technologies", type: "website", images: [{ url: "/og.png", width: 1734, height: 907, alt: "Oswell Technologies AI solutions" }] },
    twitter: { card: "summary_large_image", title: campaign.headline, description: campaign.emphasis, images: ["/og.png"] },
  };
}

export default async function CampaignPage({ params }) {
  const { variant } = await params;
  const campaign = getAiCampaign(variant);
  if (!campaign) notFound();
  return <AiSolutionsLanding campaign={campaign} />;
}
