import { explain, parseErrorText } from "whycrash";
import type { AnalysisMetadata, AnalysisResult } from "./types";
import { classifyRule } from "./category";

export { classifyRule } from "./category";

/** Calls the shipped whycrash rules. No CrashLab heuristic produces a diagnosis. */
export function analyzeWithWhycrash(input: string): AnalysisResult {
  const parsedErrors = parseErrorText(input);
  const diagnosis = explain(input, { cwd: process.cwd() }) ?? null;
  return {
    input,
    diagnosis,
    parsedErrors,
    analyzedAt: new Date().toISOString(),
    source: "whycrash",
  };
}

/** Metadata is intentionally separate from the package's rule output. */
export function getAnalysisMetadata(result: AnalysisResult): AnalysisMetadata {
  return {
    engine: "whycrash",
    ruleId: result.diagnosis?.id ?? null,
    confidence: result.diagnosis?.confidence ?? null,
    category: classifyRule(result.diagnosis?.id),
    parsedErrorCount: result.parsedErrors.length,
    supported: result.diagnosis !== null,
  };
}
