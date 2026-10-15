import { getOpenAIStatus } from "@/lib/server/openai-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const refresh = new URL(request.url).searchParams.get("refresh") === "true";
  const status = await getOpenAIStatus(refresh);
  return Response.json(status, { status: status.connected || status.status === "not_configured" ? 200 : 503 });
}
