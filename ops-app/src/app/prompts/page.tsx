import { TruthfulEmptyPage } from "@/components/production/live-page";

export default function Page() {
  return <TruthfulEmptyPage title="Prompt Manager" subtitle="Prompt configuration is displayed only from a connected production source." emptyState="No live prompt inventory connected." />;
}
