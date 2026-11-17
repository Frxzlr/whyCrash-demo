import { NextResponse } from "next/server";
import { analyzeInputSchema } from "@/lib/validation";
import { analyzeWithWhycrash, getAnalysisMetadata } from "@/lib/whycrash/analyze";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const validation = analyzeInputSchema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });

  try {
    const result = analyzeWithWhycrash(validation.data.input);
    return NextResponse.json({ result, metadata: getAnalysisMetadata(result) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The whycrash diagnostic failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
