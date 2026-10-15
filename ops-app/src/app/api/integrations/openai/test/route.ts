import { getOpenAIStatus } from "@/lib/server/openai-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const status = await getOpenAIStatus(true);
  return Response.json(status, { status: status.connected || status.status === "not_configured" ? 200 : 503 });
}
