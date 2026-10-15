import { TruthfulEmptyPage } from "@/components/production/live-page";

export default function Page() {
  return <TruthfulEmptyPage title="Live Runs" subtitle="Run history is shown only when a production run-history source is connected." emptyState="No live run data available." />;
}
