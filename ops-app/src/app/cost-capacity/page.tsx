import { TruthfulEmptyPage } from "@/components/production/live-page";

export default function Page() {
  return <TruthfulEmptyPage title="Quota, Cost & Capacity" subtitle="Cost and capacity metrics require validated production telemetry." emptyState="No live cost or capacity data available." />;
}
