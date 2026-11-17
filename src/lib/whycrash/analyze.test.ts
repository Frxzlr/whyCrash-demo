import { describe, expect, it } from "vitest";
import { analyzeWithWhycrash, classifyRule, getAnalysisMetadata } from "./analyze";

describe("whycrash integration", () => {
  it("returns a real package diagnosis for a recognized pasted error", () => {
    const result = analyzeWithWhycrash("TypeError: Cannot read properties of undefined (reading 'map')");
    expect(result.diagnosis?.id).toBe("property-of-undefined");
    expect(result.diagnosis?.confidence).toBe("medium");
    expect(result.source).toBe("whycrash");
  });

  it("keeps unsupported errors honest", () => {
    const result = analyzeWithWhycrash("A custom application failure with no Node.js details");
    expect(result.diagnosis).toBeNull();
    expect(getAnalysisMetadata(result).supported).toBe(false);
  });

  it("labels CrashLab category metadata independently from package output", () => {
    expect(classifyRule("connection-refused")).toBe("Network & HTTP");
    expect(classifyRule(undefined)).toBe("Uncategorized");
  });
});
