import { useCallback, useEffect, useState } from "react";
import type { DebugSession, WorkspaceMeta } from "@/types/session";

export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return payload as T;
}

export function useSessions() {
  const [sessions, setSessions] = useState<DebugSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    requestJson<{ sessions: DebugSession[] }>("/api/sessions")
      .then((data) => { if (active) { setSessions(data.sessions); setError(null); } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load sessions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  return { sessions, loading, error, reload };
}

export function useWorkspaceMeta() {
  const [meta, setMeta] = useState<WorkspaceMeta | null>(null);
  useEffect(() => {
    let active = true;
    requestJson<WorkspaceMeta>("/api/meta").then((data) => { if (active) setMeta(data); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  return meta;
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const show = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage((current) => current === nextMessage ? null : current), 2600);
  }, []);
  return { message, show };
}

