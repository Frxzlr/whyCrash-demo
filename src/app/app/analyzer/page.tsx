"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDownToLine, Check, ChevronDown, Clipboard, Code2, Copy, FileText, Lightbulb, LoaderCircle, MapPin, Play, RotateCcw, Save, Sparkles, Terminal, Trash2 } from "lucide-react";
import { useToast, useWorkspaceMeta, requestJson } from "@/lib/client";
import { Toast } from "@/components/shared/toast";
import type { AnalysisResult } from "@/lib/whycrash/types";
import { classifyRule } from "@/lib/whycrash/category";

const examples = [
  { name: "Property of undefined", value: "TypeError: Cannot read properties of undefined (reading 'map')\n    at main (/app/demo/api-shape/index.cjs:8:32)" },
  { name: "Connection refused", value: "TypeError: fetch failed\n    at async loadUsers (src/api/users.mjs:12:17)\n  [cause]: Error: connect ECONNREFUSED 127.0.0.1:5432\n    at TCPConnectWrap.afterConnect (node:net:1549:16)" },
  { name: "Missing module", value: "Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'expresss' imported from /app/src/server.mjs\n    at packageResolve (node:internal/modules/esm/resolve:873:9)\n    at moduleResolve (node:internal/modules/esm/resolve:946:18)" },
  { name: "Null access", value: "TypeError: Cannot read properties of null (reading 'id')\n    at renderProfile (src/components/profile.js:24:18)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)" },
  { name: "Promise rejection", value: "UnhandledPromiseRejection: Error: request failed\n    at fetchAccount (src/services/account.ts:41:11)\n    at async loadDashboard (src/app/dashboard/page.tsx:18:3)" },
  { name: "Syntax error", value: "SyntaxError: Unexpected token ';'\n    at compileSourceTextModule (node:internal/modules/esm/utils:346:16)\n    at ModuleLoader.moduleStrategy (node:internal/modules/esm/translators:117:18)" },
];

interface AnalyzeResponse { result: AnalysisResult; }
interface SessionResponse { session: { id: string }; persistence: "postgres" | "local-file"; }
interface AssistantResponse { explanation: string; }

function formatReport(result: AnalysisResult): string {
  if (!result.diagnosis) return `CrashLab error analysis\nSource: whycrash package (no matching diagnosis)\n\nInput:\n${result.input}`;
  const diagnosis = result.diagnosis;
  const location = diagnosis.location ? `\nLocation: ${diagnosis.location.file}:${diagnosis.location.line}${diagnosis.location.column ? `:${diagnosis.location.column}` : ""}` : "";
  return [
    "CrashLab diagnostic report",
    `Source: whycrash rule (${diagnosis.id})`,
    `Confidence: ${diagnosis.confidence}`,
    `\n${diagnosis.title}`,
    diagnosis.explanation,
    ...diagnosis.fixes.map((fix, index) => `\n${index + 1}. ${fix}`),
    location,
    `\nCrashLab category metadata: ${classifyRule(diagnosis.id)}`,
    `\nOriginal input:\n${result.input}`,
  ].join("\n");
}

function ErrorResult({ result }: { result: AnalysisResult }) {
  const diagnosis = result.diagnosis;
  const parsed = diagnosis?.error ?? result.parsedErrors[0];
  const frames = diagnosis?.error.frames ?? result.parsedErrors[0]?.frames ?? [];
  const location = diagnosis?.location ?? parsed?.sourceHint ?? frames.find((frame) => !frame.isInternal);

  return <>
    <div className="diagnosis-result">
      <span className={`result-state ${diagnosis ? "" : "unsupported"}`}>{diagnosis ? <><Check size={11} /> DIAGNOSIS AVAILABLE</> : <><AlertTriangle size={11} /> NO MATCHING RULE</>}</span>
      <h2>{diagnosis?.title ?? "whycrash could not identify a root cause"}</h2>
      <p className="result-message">{parsed ? `${parsed.name}${parsed.code ? ` [${parsed.code}]` : ""}: ${parsed.message}` : "No structured Node.js error could be parsed from this input."}</p>
      {diagnosis ? <>
        <div className="confidence-row"><span className={`confidence-pill ${diagnosis.confidence}`}>{diagnosis.confidence} confidence</span>{diagnosis.confidence !== "high" && <span>whycrash marks this cause as uncertain.</span>}</div>
        <div className="result-section"><div className="result-section-title"><Lightbulb size={13} /> Root cause · whycrash</div><div className="result-explanation">{diagnosis.explanation}</div></div>
        {location && <div className="result-section"><div className="result-section-title"><MapPin size={13} /> Source location</div><span className="location-chip"><Code2 size={11} />{location.file}:{location.line ?? "?"}{location.column ? `:${location.column}` : ""}</span></div>}
        {diagnosis.fixes.length > 0 && <div className="result-section"><div className="result-section-title"><Sparkles size={13} /> Suggested fixes · whycrash</div><ol className="fix-list">{diagnosis.fixes.map((fix, index) => <li key={`${index}-${fix}`}><span className="fix-number">{String(index + 1).padStart(2, "0")}</span><span><code>{fix}</code></span></li>)}</ol></div>}
        {diagnosis.docs && <div className="result-section"><a className="source-tag" href={diagnosis.docs} target="_blank" rel="noreferrer"><Terminal size={11} /> Relevant Node.js documentation ↗</a></div>}
      </> : <div className="result-section"><div className="result-explanation">The input was sent to the real whycrash package, but none of its available rules matched. CrashLab has not generated a root cause or fix.</div></div>}

      {frames.length > 0 && <div className="result-section"><div className="result-section-title"><FileText size={13} /> Stack frames <span className="panel-caption">{frames.length} parsed</span></div><div className="frame-list">{frames.slice(0, 12).map((frame, index) => <div className="frame-row" key={`${frame.file}:${frame.line}:${index}`}><span>{String(index + 1).padStart(2, "0")}</span><span className="frame-file">{frame.fn ? `${frame.fn} · ` : ""}{frame.file}</span><span className="frame-position">{frame.line ?? "?"}{frame.column ? `:${frame.column}` : ""}</span></div>)}</div></div>}
      <div className="metadata-note"><span className="source-tag"><Sparkles size={10} /> whycrash generated the diagnosis and fixes.</span><br />CrashLab category metadata: {classifyRule(diagnosis?.id)}; parsed {result.parsedErrors.length} error record{result.parsedErrors.length === 1 ? "" : "s"}.</div>
    </div>
  </>;
}

export default function AnalyzerPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveFormOpen, setSaveFormOpen] = useState(false);
  const [assistant, setAssistant] = useState<string | null>(null);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const { message, show } = useToast();
  const meta = useWorkspaceMeta();

  async function analyze() {
    if (!input.trim()) { setPageError("Paste an error or choose an example first."); return; }
    setPageError(null);
    setBusy(true);
    setResult(null);
    setSaved(false);
    setAssistant(null);
    setAssistantError(null);
    try {
      const response = await requestJson<AnalyzeResponse>("/api/analyze", { method: "POST", body: JSON.stringify({ input }) });
      setResult(response.result);
      setSaveTitle(response.result.diagnosis?.title ?? "Node.js debugging session");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Analysis failed.");
    } finally { setBusy(false); }
  }

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); void analyze(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  async function paste() {
    try { setInput(await navigator.clipboard.readText()); setPageError(null); }
    catch { setPageError("Clipboard access was denied. Paste directly into the field."); }
  }

  async function copyReport() {
    if (!result) return;
    await navigator.clipboard.writeText(formatReport(result));
    show("Diagnostic report copied");
  }

  function exportReport() {
    if (!result) return;
    const content = JSON.stringify({ ...result, crashLabMetadata: { category: classifyRule(result.diagnosis?.id), exportedAt: new Date().toISOString() } }, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `crashlab-report-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function saveSession() {
    if (!result) return;
    try {
      await requestJson<SessionResponse>("/api/sessions", { method: "POST", body: JSON.stringify({ input, title: saveTitle }) });
      setSaved(true); setSaveFormOpen(false); show("Session saved to your workspace");
    } catch (error) { setPageError(error instanceof Error ? error.message : "Could not save session."); }
  }

  async function askAssistant() {
    if (!result) return;
    setAssistantBusy(true); setAssistantError(null); setAssistant(null);
    try {
      const response = await requestJson<AssistantResponse>("/api/assistant", { method: "POST", body: JSON.stringify({ input, diagnosis: result.diagnosis ? { title: result.diagnosis.title, explanation: result.diagnosis.explanation, fixes: result.diagnosis.fixes } : null }) });
      setAssistant(response.explanation);
    } catch (error) { setAssistantError(error instanceof Error ? error.message : "AI assistant request failed."); }
    finally { setAssistantBusy(false); }
  }

  return <>
    <div className="page-heading"><div><h1>Error analyzer</h1><p>Paste a Node.js error. The whycrash package checks its built-in diagnostic rules.</p></div><div className="page-heading-actions"><span className="source-tag"><Sparkles size={11} /> Real whycrash engine</span></div></div>
    <div className="analyzer-layout">
      <section className="panel analyzer-input-panel">
        <div className="panel-header"><span className="section-label"><Terminal size={13} /> STACK TRACE INPUT</span><div className="analyzer-toolbar">
          <div className="select-wrap"><select aria-label="Load an example error" defaultValue="" onChange={(event) => { const selected = examples[Number(event.target.value)]; if (selected) { setInput(selected.value); setResult(null); setPageError(null); } }}><option value="" disabled>Examples</option>{examples.map((example, index) => <option key={example.name} value={index}>{example.name}</option>)}</select><ChevronDown size={12} /></div>
          <button className="button-outline button-sm" onClick={() => void paste()}><Clipboard size={11} /> Paste</button>
          <button className="button-outline button-sm" onClick={() => { setInput(""); setResult(null); setPageError(null); setSaved(false); }}><Trash2 size={11} /> Clear</button>
        </div></div>
        <textarea className="trace-textarea" aria-label="Node.js error or stack trace" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); void analyze(); } }} placeholder={`Paste a stack trace, error message, or Node.js log excerpt…\n\nExample:\nTypeError: Cannot read properties of undefined (reading 'map')\n    at loadUsers (src/api/users.ts:18:29)`} spellCheck={false} />
        <div className="input-footer"><span className="input-footer-note"><kbd>⌘</kbd><kbd>↵</kbd> Analyze · {new TextEncoder().encode(input).length.toLocaleString()} / 100,000 bytes</span><div className="input-footer-actions">{busy && <span className="input-status"><span className="spinner" /> Running whycrash rules…</span>}<button className="button-accent" disabled={busy || !input.trim()} onClick={() => void analyze()}><Play size={12} fill="currentColor" /> Analyze error</button></div></div>
      </section>
      <section className="panel result-panel" aria-live="polite">
        <div className="panel-header"><span className="section-label"><Sparkles size={13} /> DIAGNOSIS</span><span className="panel-caption">whycrash package output</span></div>
        {pageError && <div className="sandbox-unavailable" role="alert"><AlertTriangle size={13} /> {pageError}</div>}
        {!result && <div className="empty-state result-placeholder"><div className="empty-icon">{busy ? <LoaderCircle size={16} className="spinning-icon" /> : <Lightbulb size={16} />}</div><h3>{busy ? "Reading the stack trace" : "Your diagnosis will appear here"}</h3><p>{busy ? "The whycrash rules are checking for a matching cause." : "The package returns a root cause when one of its rules recognizes the error. Unsupported inputs stay clearly marked."}</p></div>}
        {result && <ErrorResult result={result} />}
        {result && <div className="result-actions">
          <button className="button-quiet" onClick={() => void copyReport()}><Copy size={11} /> Copy report</button>
          <button className="button-quiet" onClick={exportReport}><ArrowDownToLine size={11} /> Export JSON</button>
          {!saved && !saveFormOpen && <button className="button-quiet" onClick={() => setSaveFormOpen(true)}><Save size={11} /> Save session</button>}
          {saved && <span className="input-status"><Check size={12} /> Saved</span>}
          {meta?.aiEnabled ? <button className="button-quiet" disabled={assistantBusy} onClick={() => void askAssistant()}>{assistantBusy ? <span className="spinner" /> : <Sparkles size={11} />} Ask AI</button> : <button className="button-quiet" onClick={() => setAssistantError("AI is optional. Add AI_API_KEY in the server environment to enable it.")}><Sparkles size={11} /> AI not configured</button>}
          {saveFormOpen && <div className="save-session-form"><input aria-label="Session title" value={saveTitle} onChange={(event) => setSaveTitle(event.target.value)} maxLength={120} /><button className="button-accent button-sm" onClick={() => void saveSession()}><Save size={10} /> Save</button><button className="icon-button" onClick={() => setSaveFormOpen(false)} aria-label="Cancel save"><RotateCcw size={12} /></button></div>}
        </div>}
        {assistantError && <div className="ai-panel" style={{ margin: 14 }}><h3>AI assistant · separate from whycrash</h3><p>{assistantError}</p></div>}
        {assistant && <div className="ai-panel" style={{ margin: 14 }}><h3>AI generated explanation · optional</h3><p>{assistant}</p></div>}
      </section>
    </div>
    <Toast message={message} />
  </>;
}
