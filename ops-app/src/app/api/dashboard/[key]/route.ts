import { addAuditTrail, mutateDatabase, readDatabase } from "@/lib/server/oswell-db";
import type { TableRow } from "@/types/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const database = readDatabase();
  return Response.json({ rows: database.records[key] ?? [], database });
}

export async function POST(request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const body = (await request.json()) as { row: TableRow; action?: string };
  const database = mutateDatabase((current) => {
    const next = { ...current, records: { ...current.records, [key]: [body.row, ...(current.records[key] ?? [])] } };
    return addAuditTrail(next, key, body.row, body.action ?? "Created");
  });
  return Response.json({ row: body.row, database });
}

export async function PATCH(request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const body = (await request.json()) as { id: string; patch: Partial<TableRow>; action?: string };
  const database = mutateDatabase((current) => {
    const rows = current.records[key] ?? [];
    const before = rows.find((row) => row.id === body.id);
    const updatedRows = rows.map((row) => (row.id === body.id ? { ...row, ...body.patch } : row));
    const after = updatedRows.find((row) => row.id === body.id);
    const next = { ...current, records: { ...current.records, [key]: updatedRows } };
    return before && after ? addAuditTrail(next, key, after, body.action ?? "Updated", before) : next;
  });
  return Response.json({ database });
}

export async function DELETE(request: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
  const database = mutateDatabase((current) => {
    const before = (current.records[key] ?? []).find((row) => row.id === id);
    const next = { ...current, records: { ...current.records, [key]: (current.records[key] ?? []).filter((row) => row.id !== id) } };
    return before ? addAuditTrail(next, key, { ...before, status: "Deleted" }, "Deleted", before) : next;
  });
  return Response.json({ database });
}
