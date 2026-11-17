import { NextResponse } from "next/server";
import { deleteSession, getSession, updateSession } from "@/lib/database/sessions";
import { sessionPatchSchema } from "@/lib/validation";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getSession(id);
  return session ? NextResponse.json({ session }) : NextResponse.json({ error: "Session not found." }, { status: 404 });
}

export async function PATCH(request: Request, context: RouteContext) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const validation = sessionPatchSchema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Invalid update." }, { status: 400 });
  const { id } = await context.params;
  const session = await updateSession(id, validation.data);
  return session ? NextResponse.json({ session }) : NextResponse.json({ error: "Session not found." }, { status: 404 });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deleteSession(id);
  return deleted ? NextResponse.json({ deleted: true }) : NextResponse.json({ error: "Session not found." }, { status: 404 });
}
