import { TruthfulEmptyPage } from "@/components/production/live-page";

export default function Page() {
  return <TruthfulEmptyPage title="Threats & Incidents" subtitle="Incidents are shown only when a live incident-management source is connected." emptyState="No live incidents available." />;
}
