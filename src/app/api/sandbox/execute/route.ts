import { NextResponse } from "next/server";
import { analyzeWithWhycrash, getAnalysisMetadata } from "@/lib/whycrash/analyze";
import { executeInDocker } from "@/lib/sandbox/execute";
import { isSandboxAvailable, sandboxImage } from "@/lib/sandbox/docker";
import { sandboxInputSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 8;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const validation = sandboxInputSchema.safeParse(body);
  if (!validation.success) return NextResponse.json({ error: validation.error.issues[0]?.message ?? "Invalid code." }, { status: 400 });
  if (!isSandboxAvailable()) {
    return NextResponse.json({ error: `Docker or the configured image is unavailable. Start Docker Desktop and run docker pull ${sandboxImage()} before executing code.` }, { status: 503 });
  }

  try {
    const execution = await executeInDocker(validation.data.source);
    const errorText = execution.stderr.trim();
    const analysis = execution.exitCode !== 0 && errorText ? analyzeWithWhycrash(errorText) : null;
    return NextResponse.json({
      ...execution,
      errorText,
      diagnosis: analysis?.diagnosis ?? null,
      analysisMetadata: analysis ? getAnalysisMetadata(analysis) : null,
      sandbox: { image: sandboxImage(), isolated: true, network: "disabled", timeoutMs: 3_500, memoryMb: 64 },
    });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "ENOENT") return NextResponse.json({ error: "Docker CLI was not found. Install Docker Desktop to use the playground." }, { status: 503 });
    return NextResponse.json({ error: "The isolated execution failed. Confirm the configured container image is already available locally." }, { status: 500 });
  }
}
