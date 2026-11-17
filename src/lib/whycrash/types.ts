import type { Diagnosis, ErrorInfo } from "whycrash";

export type { Diagnosis, ErrorInfo };

export interface AnalysisResult {
  input: string;
  diagnosis: Diagnosis | null;
  parsedErrors: ErrorInfo[];
  analyzedAt: string;
  source: "whycrash";
}

export interface AnalysisMetadata {
  engine: "whycrash";
  ruleId: string | null;
  confidence: Diagnosis["confidence"] | null;
  category: string;
  parsedErrorCount: number;
  supported: boolean;
}
