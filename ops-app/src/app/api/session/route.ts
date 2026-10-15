export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    user: null,
    roles: [],
    session: {
      status: "not_configured"
    }
  });
}
