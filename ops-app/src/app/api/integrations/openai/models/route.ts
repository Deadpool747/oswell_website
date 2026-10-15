import { listOpenAIModels } from "@/lib/server/openai-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json({ items: await listOpenAIModels() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load OpenAI models." }, { status: 503 });
  }
}
