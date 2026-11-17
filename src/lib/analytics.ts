import type { DebugSession } from "@/types/session";

export interface FrequencyPoint {
  day: string;
  count: number;
  dateKey: string;
}

export function frequencyByDay(sessions: DebugSession[], numberOfDays = 14, now = new Date()): FrequencyPoint[] {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const key = new Date(session.createdAt).toLocaleDateString("en-CA");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - numberOfDays + 1);
  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = date.toLocaleDateString("en-CA");
    return { dateKey, day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count: counts.get(dateKey) ?? 0 };
  });
}

export function categoryCounts(sessions: DebugSession[]): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const key = session.category ?? "Uncategorized";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function commonErrors(sessions: DebugSession[]): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const name = session.diagnosis?.error.message || session.errorType || "Unrecognized error";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
}
