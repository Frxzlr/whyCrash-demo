import type { Diagnosis } from "whycrash";

export interface DebugSession {
  id: string;
  title: string;
  input: string;
  diagnosis: Diagnosis | null;
  errorType: string | null;
  category: string | null;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMeta {
  persistence: "postgres" | "local-file";
  aiEnabled: boolean;
  sandboxAvailable: boolean;
  sandboxImage: string;
}
