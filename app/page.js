import { LeadGenExplorer } from "@/components/leadgen/LeadGenExplorer";
import { loadLeadgenData } from "@/lib/leadgen-data";

export const metadata = {
  title: "Oswell Ops | Lead Intelligence",
  description: "Oswell Ops is a lead intelligence dashboard for public business data and project intake.",
};

export default function HomePage() {
  const initialData = loadLeadgenData();
  return <LeadGenExplorer initialData={initialData} />;
}
