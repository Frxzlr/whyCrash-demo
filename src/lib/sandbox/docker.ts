import { execFileSync } from "node:child_process";

let dockerAvailable: boolean | null = null;
let checkedAt = 0;

export function sandboxImage(): string {
  return process.env.CRASHLAB_SANDBOX_IMAGE?.trim() || "node:24-alpine";
}

export function isSandboxAvailable(): boolean {
  if (dockerAvailable !== null && Date.now() - checkedAt < 15_000) return dockerAvailable;
  checkedAt = Date.now();
  try {
    execFileSync("docker", ["info", "--format", "{{.ServerVersion}}"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1_000,
    });
    execFileSync("docker", ["image", "inspect", sandboxImage(), "--format", "{{.Id}}"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 800,
    });
    dockerAvailable = true;
  } catch {
    dockerAvailable = false;
  }
  return dockerAvailable;
}
