import { TruthfulEmptyPage } from "@/components/production/live-page";

export default function Page() {
  return <TruthfulEmptyPage title="Metrics" subtitle="Metrics are displayed only when sufficient production telemetry is available." emptyState="Not enough live historical data yet." />;
}
