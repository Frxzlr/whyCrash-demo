"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, Clock3, FileClock, RotateCcw, Save, Search, Trash2, X } from "lucide-react";
import { Toast } from "@/components/shared/toast";
import { requestJson, useSessions, useToast } from "@/lib/client";
import type { DebugSession } from "@/types/session";

function dateLabel(value: string): string {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function SessionsPage() {
  const { sessions, loading, error, reload } = useSessions();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { message, show } = useToast();
  const selected = sessions.find((session) => session.id === selectedId) ?? null;
  const filtered = useMemo(() => sessions.filter((session) => `${session.title} ${session.errorType ?? ""} ${session.category ?? ""} ${session.diagnosis?.title ?? ""}`.toLowerCase().includes(search.toLowerCase())), [sessions, search]);

  async function changeResolution(session: DebugSession) {
    setBusyId(session.id);
    try {
      await requestJson(`/api/sessions/${encodeURIComponent(session.id)}`, { method: "PATCH", body: JSON.stringify({ resolved: !session.resolved }) });
      reload(); show(session.resolved ? "Session reopened" : "Session marked resolved");
    } catch (reason) { show(reason instanceof Error ? reason.message : "Could not update session"); }
    finally { setBusyId(null); }
  }

  async function renameSession() {
    if (!selected) return;
    setBusyId(selected.id);
    try {
      await requestJson(`/api/sessions/${encodeURIComponent(selected.id)}`, { method: "PATCH", body: JSON.stringify({ title }) });
      reload(); show("Session title updated");
    } catch (reason) { show(reason instanceof Error ? reason.message : "Could not rename session"); }
    finally { setBusyId(null); }
  }

  async function deleteSession(session: DebugSession) {
    if (!window.confirm(`Delete “${session.title}”? This removes the saved input and diagnosis.`)) return;
    setBusyId(session.id);
    try {
      await requestJson(`/api/sessions/${encodeURIComponent(session.id)}`, { method: "DELETE" });
      setSelectedId((current) => current === session.id ? null : current);
      reload(); show("Session deleted");
    } catch (reason) { show(reason instanceof Error ? reason.message : "Could not delete session"); }
    finally { setBusyId(null); }
  }

  return <>
    <div className="page-heading"><div><h1>Debugging sessions</h1><p>Reopen saved errors, keep notes through a title, and mark issues resolved.</p></div><div className="page-heading-actions"><div className="session-toolbar"><label className="search-field"><Search size={12} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sessions" aria-label="Search sessions" /></label></div></div></div>
    {error && <div className="sandbox-unavailable" role="alert">{error}</div>}
    <section className="panel">
      <div className="panel-header"><span className="panel-title">Saved sessions</span><span className="panel-caption">{loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "session" : "sessions"}`}</span></div>
      <div style={{ overflowX: "auto" }}><table className="session-table"><thead><tr><th>SESSION</th><th>TYPE</th><th>CATEGORY</th><th>STATUS</th><th>LAST UPDATED</th><th /></tr></thead>
        <tbody>{loading ? Array.from({ length: 4 }, (_, index) => <tr key={index}><td colSpan={6}><div className="skeleton" style={{ height: 18 }} /></td></tr>) : filtered.length === 0 ? <tr><td colSpan={6} className="table-empty"><div className="empty-state"><div className="empty-icon"><FileClock size={16} /></div><h3>{sessions.length ? "No sessions match" : "No saved sessions yet"}</h3><p>{sessions.length ? "Try another title or error type." : "Analyze an error and save it to reopen the input and diagnosis here."}</p></div></td></tr> : filtered.map((session) => <tr key={session.id}>
          <td><button className="session-open" onClick={() => { if (selectedId === session.id) { setSelectedId(null); } else { setSelectedId(session.id); setTitle(session.title); } }} aria-expanded={selectedId === session.id}><span className="session-name">{session.title}</span><span className="session-error">{session.diagnosis?.title ?? session.errorType ?? "No matching whycrash rule"}</span></button></td>
          <td>{session.errorType ?? "—"}</td><td><span className="category-pill">{session.category ?? "Uncategorized"}</span></td>
          <td>{session.resolved ? <span className="resolved-pill"><CheckCircle2 size={11} /> Resolved</span> : <span className="open-pill"><Clock3 size={11} /> Open</span>}</td>
          <td>{dateLabel(session.updatedAt)}</td><td><div className="row-actions"><button className="icon-button" disabled={busyId === session.id} aria-label={session.resolved ? "Reopen session" : "Mark session resolved"} title={session.resolved ? "Reopen" : "Resolve"} onClick={() => void changeResolution(session)}>{session.resolved ? <RotateCcw size={12} /> : <Check size={12} />}</button><button className="icon-button" disabled={busyId === session.id} aria-label="Delete session" title="Delete" onClick={() => void deleteSession(session)}><Trash2 size={12} /></button></div></td>
        </tr>)}</tbody></table></div>
      {!loading && sessions.length > 0 && <div className="pagination-note">Analytics use saved sessions only. Category labels are CrashLab metadata.</div>}
    </section>

    {selected && <section className="panel session-detail">
      <div className="panel-header"><span className="panel-title">Session details</span><button className="icon-button" aria-label="Close details" onClick={() => setSelectedId(null)}><X size={13} /></button></div>
      <div className="detail-title-row"><input aria-label="Edit session title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} /><button className="button-quiet button-sm" disabled={busyId === selected.id || title.trim() === selected.title || !title.trim()} onClick={() => void renameSession()}><Save size={10} /> Save title</button></div>
      <div className="session-detail-columns"><div><div className="result-section-title"><FileClock size={12} /> Original error input</div><pre className="session-input-view">{selected.input}</pre></div><div>
        <div className="result-section-title"><CheckCircle2 size={12} /> whycrash diagnosis</div>
        {selected.diagnosis ? <div className="session-diagnosis"><span className="source-tag">WHYCRASH RULE · {selected.diagnosis.id}</span><h3>{selected.diagnosis.title}</h3><p>{selected.diagnosis.explanation}</p><span className={`confidence-pill ${selected.diagnosis.confidence}`}>{selected.diagnosis.confidence} confidence</span>{selected.diagnosis.fixes.length > 0 && <ol className="fix-list">{selected.diagnosis.fixes.map((fix, index) => <li key={fix}><span className="fix-number">{index + 1}</span><code>{fix}</code></li>)}</ol>}</div> : <div className="session-diagnosis"><p>No whycrash rule matched when this session was saved. The original input is preserved for review.</p></div>}
      </div></div>
      <div className="session-detail-actions"><span className="panel-caption">Created {dateLabel(selected.createdAt)}</span><button className="button-quiet button-sm" onClick={() => void changeResolution(selected)}>{selected.resolved ? <><RotateCcw size={11} /> Reopen</> : <><Check size={11} /> Mark resolved</>}</button></div>
    </section>}
    <Toast message={message} />
  </>;
}
