import { NextResponse } from "next/server";
import { analyzeWithWhycrash, classifyRule } from "@/lib/whycrash/analyze";
import { createSession, listSessions, persistenceMode } from "@/lib/database/sessions";
import { sessionCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ sessions: await listSessions(), persistence: persistenceMode() });
  } catch {
    return NextResponse.json({ error: "Could not load debugging sessions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const validation = sessionCreateSchema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Invalid session." }, { status: 400 });

  try {
    const result = analyzeWithWhycrash(validation.data.input);
    const diagnosis = result.diagnosis;
    const errorType = diagnosis?.error.name ?? result.parsedErrors[0]?.name ?? null;
    const generatedTitle = diagnosis?.title ?? `${errorType ?? "Node.js error"} debugging session`;
    const session = await createSession({
      title: validation.data.title || generatedTitle.slice(0, 120),
      input: validation.data.input,
      diagnosis,
      errorType,
      category: classifyRule(diagnosis?.id),
    });
    return NextResponse.json({ session, persistence: persistenceMode() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save this session. Check the database configuration if PostgreSQL is enabled." }, { status: 500 });
  }
}
