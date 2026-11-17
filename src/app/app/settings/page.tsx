"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, Database, ExternalLink, LockKeyhole, Package, ShieldCheck, Sparkles } from "lucide-react";
import { Toast } from "@/components/shared/toast";
import { useToast, useWorkspaceMeta } from "@/lib/client";

export default function SettingsPage() {
  const meta = useWorkspaceMeta();
  const { message, show } = useToast();
  const [copied, setCopied] = useState(false);
  async function copyCommand() {
    await navigator.clipboard.writeText("npm run db:push");
    setCopied(true); show("Command copied");
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <>
    <div className="page-heading"><div><h1>Settings</h1><p>Check the local services and integrations that power this workspace.</p></div></div>
    <div className="settings-layout">
      <section className="panel">
        <div className="panel-header"><span className="panel-title">Workspace services</span><span className="panel-caption">Server-side configuration</span></div>
        <div className="settings-section"><div className="settings-row"><span className="settings-icon"><Database size={14} /></span><div className="settings-copy"><h3>Session persistence</h3><p>{meta?.persistence === "postgres" ? "Sessions use PostgreSQL through Prisma." : "Sessions are saved to .crashlab/sessions.json on this machine."}</p></div><span className={`settings-status ${meta?.persistence === "postgres" ? "good" : "neutral"}`}>{meta?.persistence === "postgres" ? "PostgreSQL" : meta ? "Local file" : "Checking…"}</span></div>
          {meta?.persistence !== "postgres" && <div className="settings-followup"><span>To switch to PostgreSQL, set <code>DATABASE_URL</code> in your local .env file, then apply the Prisma schema.</span><button className="button-quiet button-sm" onClick={() => void copyCommand()}>{copied ? <Check size={10} /> : <Copy size={10} />} npm run db:push</button></div>}
        </div>
        <div className="settings-section"><div className="settings-row"><span className="settings-icon"><Sparkles size={14} /></span><div className="settings-copy"><h3>AI debugging assistant</h3><p>{meta?.aiEnabled ? "Optional AI explanations are enabled on the server." : "whycrash works without AI. Add a server-side provider key to enable explanations."}</p></div><span className={`settings-status ${meta?.aiEnabled ? "good" : "neutral"}`}>{meta?.aiEnabled ? "Enabled" : "Optional"}</span></div>
          <div className="settings-followup"><span>Configure <code>AI_API_KEY</code>, and optionally <code>AI_API_URL</code> and <code>AI_MODEL</code>, in .env. Values are never exposed in this page.</span></div>
        </div>
        <div className="settings-section"><div className="settings-row"><span className="settings-icon"><LockKeyhole size={14} /></span><div className="settings-copy"><h3>Playground isolation</h3><p>Docker execution uses a network-disabled, resource-limited disposable container.</p></div><span className={`settings-status ${meta?.sandboxAvailable ? "good" : "warn"}`}>{meta?.sandboxAvailable ? "Docker ready" : "Unavailable"}</span></div>
          <div className="settings-followup"><span>Configured image: <code>{meta?.sandboxImage ?? "node:24-alpine"}</code>. Install Docker Desktop, start its daemon, then preload the image before running code.</span></div>
        </div>
      </section>
      <aside className="panel"><div className="panel-header"><span className="panel-title">Product information</span><span className="panel-caption">Runtime and source</span></div>
        <div className="settings-section"><h3>whycrash integration</h3><p>The built-in package rules run locally in the Node.js server process. Unsupported errors remain unmatched; no diagnostic fallback is used.</p><div className="info-list"><div className="info-line"><span>Engine</span><strong>whycrash 0.1.0</strong></div><div className="info-line"><span>Rule source</span><strong>Package built-ins</strong></div><div className="info-line"><span>AI required</span><strong>No</strong></div></div></div>
        <div className="settings-section"><h3>Source links</h3><div className="docs-links"><a href="https://github.com/Frxzlr/Npm-Package" target="_blank" rel="noreferrer"><Package size={12} /> GitHub <ArrowUpRight size={10} /></a><a href="https://www.npmjs.com/package/whycrash" target="_blank" rel="noreferrer"><ExternalLink size={12} /> npm <ArrowUpRight size={10} /></a></div></div>
        <div className="settings-section"><h3>Local-first behavior</h3><p>Error analysis runs without external services. Saved session inputs stay in local development storage or the configured database. AI is only called after you request an explanation.</p><div className="source-tag" style={{ marginTop: 11 }}><ShieldCheck size={11} /> No usage telemetry in whycrash</div></div>
      </aside>
    </div>
    <Toast message={message} />
  </>;
}
