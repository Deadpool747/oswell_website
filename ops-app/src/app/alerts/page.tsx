import { TruthfulEmptyPage } from "@/components/production/live-page";

export default function Page() {
  return <TruthfulEmptyPage title="Alerts" subtitle="Production alert records require a connected alert source." emptyState="No live alerts available." />;
}
