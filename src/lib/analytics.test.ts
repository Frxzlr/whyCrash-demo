import { describe, expect, it } from "vitest";
import { categoryCounts, commonErrors, frequencyByDay } from "./analytics";
import type { DebugSession } from "@/types/session";

const sessions = (overrides: Partial<DebugSession> = {}): DebugSession => ({
  id: "a", title: "Test", input: "TypeError", diagnosis: null, errorType: "TypeError", category: "JavaScript runtime",
  resolved: false, createdAt: "2026-04-10T12:00:00.000Z", updatedAt: "2026-04-10T12:00:00.000Z", ...overrides,
});

describe("analytics derive only from saved sessions", () => {
  it("groups category counts from the stored session metadata", () => {
    expect(categoryCounts([sessions(), sessions({ id: "b" }), sessions({ id: "c", category: "Network & HTTP" })])).toEqual([
      { name: "JavaScript runtime", count: 2 }, { name: "Network & HTTP", count: 1 },
    ]);
  });

  it("counts saved error messages", () => {
    expect(commonErrors([sessions(), sessions({ id: "b" })])).toEqual([{ name: "TypeError", count: 2 }]);
  });

  it("returns the requested daily window, including zero-count days", () => {
    const points = frequencyByDay([sessions()], 3, new Date("2026-04-10T12:00:00.000Z"));
    expect(points).toHaveLength(3);
    expect(points.reduce((sum, point) => sum + point.count, 0)).toBe(1);
  });
});
