import { TruthfulEmptyPage } from "@/components/production/live-page";

export default function Page() {
  return <TruthfulEmptyPage title="Guardrails" subtitle="Guardrail records are shown only from a connected production source." emptyState="No live guardrail data available." />;
}
