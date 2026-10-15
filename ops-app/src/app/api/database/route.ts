import { readDatabase } from "@/lib/server/oswell-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json(readDatabase());
}
