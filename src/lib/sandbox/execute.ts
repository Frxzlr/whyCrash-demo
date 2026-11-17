import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { sandboxImage } from "./docker";

const timeoutMs = 3_500;
const outputLimit = 24_000;

export interface SandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  outputLimited: boolean;
  durationMs: number;
}

function removeContainer(name: string): void {
  try {
    execFileSync("docker", ["rm", "-f", name], { stdio: "ignore", timeout: 1_500 });
  } catch {
    // The container can already have exited and removed itself.
  }
}

/** Runs untrusted source only in a short-lived Docker container with no network or writable root. */
export function executeInDocker(source: string): Promise<SandboxResult> {
  const name = `crashlab-${randomUUID()}`;
  const startedAt = Date.now();
  const args = [
    "run", "--rm", "--pull=never", "--name", name,
    "--network=none", "--memory=64m", "--memory-swap=64m", "--cpus=0.5", "--pids-limit=24",
    "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=8m", "--cap-drop=ALL",
    "--security-opt=no-new-privileges:true", "--user=65534:65534",
    "--env", "NODE_ENV=production", "--env", "NODE_OPTIONS=--max-old-space-size=40",
    sandboxImage(), "node", "-e", source,
  ];

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let keptBytes = 0;
    let timedOut = false;
    let outputLimited = false;
    let settled = false;
    const child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });

    const append = (target: "stdout" | "stderr", data: Buffer) => {
      if (settled) return;
      const remaining = Math.max(0, outputLimit - keptBytes);
      const chunk = data.subarray(0, remaining).toString("utf8");
      if (target === "stdout") stdout += chunk;
      else stderr += chunk;
      keptBytes += Buffer.byteLength(chunk);
      if (data.length > remaining && !outputLimited) {
        outputLimited = true;
        child.kill("SIGTERM");
      }
    };

    child.stdout.on("data", (data: Buffer) => append("stdout", data));
    child.stderr.on("data", (data: Buffer) => append("stderr", data));

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      if (timedOut || outputLimited) removeContainer(name);
      resolve({ stdout, stderr, exitCode: code, timedOut, outputLimited, durationMs: Date.now() - startedAt });
    });
  });
}
