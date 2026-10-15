import { TruthfulEmptyPage } from "@/components/production/live-page";

export default function Page() {
  return <TruthfulEmptyPage title="Secrets & Credentials" subtitle="Secret values are never shown in Oswell; inventory requires a connected provider." emptyState="No live secrets inventory connected." />;
}
