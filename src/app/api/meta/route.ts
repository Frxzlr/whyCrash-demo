import { NextResponse } from "next/server";
import { persistenceMode } from "@/lib/database/sessions";
import { isSandboxAvailable, sandboxImage } from "@/lib/sandbox/docker";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    persistence: persistenceMode(),
    aiEnabled: Boolean(process.env.AI_API_KEY),
    sandboxAvailable: isSandboxAvailable(),
    sandboxImage: sandboxImage(),
  });
}
