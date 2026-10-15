import { TruthfulEmptyPage } from "@/components/production/live-page";

export default function Page() {
  return <TruthfulEmptyPage title="Replay Studio" subtitle="Replay records require a connected production run-history source." emptyState="No live replay data available." />;
}
