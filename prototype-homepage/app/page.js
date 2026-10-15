import { LeadGenExplorer } from "@/components/leadgen/LeadGenExplorer";
import { loadLeadgenData } from "@/lib/leadgen-data";

export const metadata = {
  title: "Lead Platform | Oswell Technologies",
  description: "Open-source Apollo-style lead generation dashboard for public business data.",
};

export default function HomePage() {
  const initialData = loadLeadgenData();
  return <LeadGenExplorer initialData={initialData} />;
}
