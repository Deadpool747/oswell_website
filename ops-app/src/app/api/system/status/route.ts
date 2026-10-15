import { readDatabase } from "@/lib/server/oswell-db";
import { getOpenAIStatus } from "@/lib/server/openai-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function status(configured: boolean) {
  return configured
    ? { status: "not_verified" as const, message: "Configured but no provider health check has been implemented." }
    : { status: "not_configured" as const, message: "Credentials are not configured." };
}

export async function GET() {
  try {
    readDatabase();
    return Response.json({
      api: { status: "healthy" },
      database: { status: "healthy", engine: "sqlite" },
      redis: { status: "not_configured", message: "Redis is not configured." },
      opik: status(Boolean(process.env.OPIK_API_KEY)),
      microsoft_foundry: status(Boolean(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY)),
      openai: await getOpenAIStatus(),
      mode: process.env.APP_MODE === "demo" ? "demo" : "live"
    });
  } catch {
    return Response.json({ api: { status: "degraded" }, database: { status: "unhealthy" } }, { status: 503 });
  }
}
