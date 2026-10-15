import { TruthfulEmptyPage } from "@/components/production/live-page";

export default function Page() {
  return <TruthfulEmptyPage title="Deployment & Environment" subtitle="Deployment inventory is displayed only from a connected production source." emptyState="No live deployment inventory connected." />;
}
