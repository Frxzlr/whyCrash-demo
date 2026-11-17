"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AlertTriangle, Bug, ChevronRight, CloudOff, Code2, FileCode2, FlaskConical, Layers3, LockKeyhole, Play, RefreshCw, Save, ShieldCheck, Sparkles, Wifi } from "lucide-react";
import { Toast } from "@/components/shared/toast";
import { requestJson, useToast, useWorkspaceMeta } from "@/lib/client";
import type { Diagnosis } from "whycrash";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="editor-host"><div className="skeleton" style={{ width: "100%", height: "100%" }} /></div>,
});

interface Scenario { id: string; title: string; description: string; icon: typeof Bug; source: string; }
const scenarios: Scenario[] = [
  { id: "reference", title: "ReferenceError", description: "Read a variable before it exists.", icon: Bug, source: "function greet() {\n  console.log(userName);\n}\n\ngreet();" },
  { id: "type", title: "TypeError", description: "Call a method on the wrong value.", icon: Code2, source: "const users = undefined;\nconsole.log(users.map((user) => user.name));" },
  { id: "syntax", title: "SyntaxError", description: "Let Node.js catch a syntax mistake.", icon: FileCode2, source: "const config = {\n  retries: 3,\n  timeout: ;\n};\nconsole.log(config);" },
  { id: "module", title: "MODULE_NOT_FOUND", description: "Import a package that is not installed.", icon: Layers3, source: "const missing = require('crashlab-package-that-does-not-exist');\nconsole.log(missing);" },
  { id: "network", title: "Network error", description: "Attempt a request with networking disabled.", icon: Wifi, source: "fetch('http://127.0.0.1:54321/api')\n  .then((response) => response.json())\n  .catch((error) => { console.error(error); process.exitCode = 1; });" },
  { id: "null", title: "Null / undefined access", description: "Dereference a nullable value.", icon: AlertTriangle, source: "const profile = null;\nconsole.log(profile.account.id);" },
  { id: "promise", title: "Promise rejection", description: "Reject a promise without handling it.", icon: RefreshCw, source: "Promise.reject(new Error('Payment provider timed out'));" },
  { id: "async", title: "Async error", description: "Trace a thrown error through async calls.", icon: FlaskConical, source: "async function loadAccount() {\n  throw new Error('Account record is missing');\n}\n\nasync function start() {\n  await loadAccount();\n}\n\nstart().catch((error) => {\n  console.error(error);\n  process.exitCode = 1;\n});" },
];

interface ExecutionResponse {
  stdout: string;
  stderr: string;
  errorText: string;
  exitCode: number | null;
  timedOut: boolean;
  outputLimited: boolean;
  durationMs: number;
  diagnosis: Diagnosis | null;
}

export default function PlaygroundPage() {
  const [scenario, setScenario] = useState(scenarios[0]!);
  const [source, setSource] = useState(scenarios[0]!.source);
  const [execution, setExecution] = useState<ExecutionResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { message, show } = useToast();
  const meta = useWorkspaceMeta();

  async function run() {
    setRunning(true); setError(null); setExecution(null);
    try { setExecution(await requestJson<ExecutionResponse>("/api/sandbox/execute", { method: "POST", body: JSON.stringify({ source }) })); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Execution failed."); }
    finally { setRunning(false); }
  }

  async function saveResult() {
    if (!execution?.errorText) return;
    try {
      await requestJson("/api/sessions", { method: "POST", body: JSON.stringify({ input: execution.errorText, title: `${scenario.title} playground run` }) });
      show("Playground session saved");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save session."); }
  }

  const output = execution ? (execution.stderr || execution.stdout || (execution.timedOut ? "Execution timed out after 3.5 seconds." : "Process exited without output.")) : "Run the current program to capture its output and diagnose any error.";
  const executionFailed = Boolean(execution && (execution.exitCode !== 0 || execution.timedOut || execution.outputLimited));

  return <>
    <div className="page-heading"><div><h1>Crash playground</h1><p>Experiment with Node.js errors. Code runs in a short-lived, network-disabled Docker container.</p></div><div className="page-heading-actions"><span className={`sandbox-status ${meta?.sandboxAvailable ? "available" : "unavailable"}`}>{meta?.sandboxAvailable ? <><span className="green-dot" /> Docker ready</> : <><CloudOff size={11} /> Docker unavailable</>}</span></div></div>
    <div className="playground-layout">
      <section className="panel editor-panel">
        <div className="editor-top"><div className="editor-tab"><Code2 size={13} /> playground.js</div><div className="editor-actions"><span className="panel-caption">JavaScript · Node.js 24</span><button className="button-accent button-sm" disabled={running || !meta?.sandboxAvailable || !source.trim()} onClick={() => void run()}><Play size={11} fill="currentColor" />{running ? "Running…" : "Run code"}</button></div></div>
        <div className="editor-host"><Editor language="javascript" theme="vs-dark" value={source} onChange={(value) => setSource(value ?? "")} options={{ fontSize: 12, fontFamily: "SFMono-Regular, Consolas, monospace", minimap: { enabled: false }, padding: { top: 14, bottom: 14 }, scrollBeyondLastLine: false, wordWrap: "on", automaticLayout: true, lineNumbersMinChars: 3, renderLineHighlight: "gutter", overviewRulerLanes: 0, hideCursorInOverviewRuler: true, scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 }, tabSize: 2 }} /></div>
        <div className="execution-output"><div className="execution-output-head"><span>OUTPUT</span>{execution && <span>{execution.durationMs} ms · exit {execution.exitCode ?? "—"}</span>}</div><div className={`output-body ${executionFailed ? "error" : ""}`}>{error ? error : output}</div></div>
        {execution?.timedOut && <div className="sandbox-unavailable"><AlertTriangle size={12} /> Execution stopped at the time limit. The container was removed.</div>}
        {execution?.outputLimited && <div className="sandbox-unavailable"><AlertTriangle size={12} /> Output exceeded 24 KB and was truncated; the container was stopped.</div>}
        {execution?.diagnosis && <div className="playground-diagnosis"><div className="result-section-title"><Sparkles size={13} /> Whycrash diagnosis <span className="confidence-pill">{execution.diagnosis.confidence} confidence</span></div><h3>{execution.diagnosis.title}</h3><p>{execution.diagnosis.explanation}</p>{execution.diagnosis.fixes.length > 0 && <ol className="fix-list">{execution.diagnosis.fixes.map((fix, index) => <li key={fix}><span className="fix-number">{index + 1}</span><code>{fix}</code></li>)}</ol>}<div className="playground-save"><span className="source-tag">Rule · {execution.diagnosis.id}</span><button className="button-quiet button-sm" onClick={() => void saveResult()}><Save size={10} /> Save session</button></div></div>}
        {!meta?.sandboxAvailable && <div className="sandbox-unavailable"><CloudOff size={13} /><span>Execution is disabled until Docker is available. Install Docker Desktop, start it, then run <code>docker pull {meta?.sandboxImage ?? "node:24-alpine"}</code>.</span></div>}
      </section>

      <aside className="panel"><div className="panel-header"><span className="section-label"><FlaskConical size={13} /> EXAMPLE SCENARIOS</span><span className="panel-caption">{scenarios.length} examples</span></div><div className="scenario-list">{scenarios.map((item) => { const Icon = item.icon; return <button key={item.id} className={`scenario-button ${item.id === scenario.id ? "selected" : ""}`} onClick={() => { setScenario(item); setSource(item.source); setExecution(null); setError(null); }}><span className="scenario-icon"><Icon size={13} /></span><span className="scenario-text"><span className="scenario-title">{item.title}</span><span className="scenario-desc">{item.description}</span></span><ChevronRight size={13} className="scenario-chevron" /></button>; })}</div>
        <div className="sandbox-note"><LockKeyhole size={13} /><span><strong>Container boundaries</strong><br />No network · 64 MB memory · 3.5 s timeout · read-only root · dropped capabilities. Docker image: {meta?.sandboxImage ?? "node:24-alpine"}.</span></div>
        <div className="sandbox-note"><ShieldCheck size={13} /><span>Container isolation limits exposure but is not a perfect security boundary. Run only code you understand.</span></div>
      </aside>
    </div>
    <Toast message={message} />
  </>;
}
