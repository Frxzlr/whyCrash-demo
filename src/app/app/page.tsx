"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Bug, CheckCircle2, FileClock, FolderTree, Plus, ShieldAlert, Sparkles } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSessions } from "@/lib/client";
import { categoryCounts, frequencyByDay } from "@/lib/analytics";

function relativeDate(value: string): string {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function OverviewPage() {
  const { sessions, loading, error } = useSessions();
  const resolvedCount = sessions.filter((session) => session.resolved).length;
  const openCount = sessions.length - resolvedCount;
  const categories = categoryCounts(sessions);
  const frequency = frequencyByDay(sessions, 14);
  const maxCategory = Math.max(1, ...categories.map((item) => item.count));

  return <>
    <div className="page-heading"><div><h1>Overview</h1><p>A clear view of the debugging work in this workspace.</p></div><div className="page-heading-actions"><Link className="button-accent" href="/app/analyzer"><Plus size={13} /> New analysis</Link></div></div>
    {error && <div className="sandbox-unavailable" role="alert"><ShieldAlert size={13} /> {error} — local metrics can’t load until the session store is available.</div>}
    <div className="metric-grid">
      {[
        { label: "Errors analyzed", value: sessions.length, note: "Saved debugging sessions", icon: Bug },
        { label: "Resolved", value: resolvedCount, note: sessions.length ? `${Math.round((resolvedCount / sessions.length) * 100)}% of saved sessions` : "No resolutions recorded yet", icon: CheckCircle2 },
        { label: "Open sessions", value: openCount, note: "Still in your debugging queue", icon: FileClock },
        { label: "Categories", value: categories.length, note: "CrashLab labels from diagnoses", icon: FolderTree },
      ].map((metric, index) => <motion.article className="metric-card" key={metric.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .045 }}>
        <div className="metric-label"><span>{metric.label}</span><span className="metric-icon"><metric.icon size={13} /></span></div>
        <div className="metric-value">{loading ? "—" : metric.value}</div>
        <div className="metric-note">{metric.note}</div>
      </motion.article>)}
    </div>

    <div className="overview-grid">
      <section className="panel"><div className="panel-header"><span className="panel-title">Error frequency</span><span className="panel-caption">Saved sessions · last 14 days</span></div>
        <div className="chart-wrap">
          {loading ? <div className="skeleton" style={{ width: "100%", height: "100%" }} /> : sessions.length === 0 ? <div className="chart-empty"><div className="chart-empty-inner"><Activity size={20} /><span>Run an analysis and save it to build your timeline.</span></div></div> : <ResponsiveContainer width="100%" height="100%"><LineChart data={frequency} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="#24232c" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#777581", fontSize: 8 }} interval={2} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#777581", fontSize: 8 }} width={28} />
            <Tooltip contentStyle={{ background: "#1a191f", border: "1px solid #393743", borderRadius: 5, color: "#d2d0da", fontSize: 9 }} labelStyle={{ color: "#aaa8b4" }} />
            <Line type="monotone" dataKey="count" name="Sessions" stroke="#9786f4" strokeWidth={2} dot={{ r: 2, fill: "#b6a7ff", strokeWidth: 0 }} activeDot={{ r: 4 }} />
          </LineChart></ResponsiveContainer>}
        </div>
      </section>
      <section className="panel"><div className="panel-header"><span className="panel-title">Error categories</span><span className="panel-caption">CrashLab metadata</span></div>
        {loading ? <div className="category-list"><div className="skeleton" style={{ height: 18 }} /><div className="skeleton" style={{ height: 18 }} /><div className="skeleton" style={{ height: 18 }} /></div> : categories.length === 0 ? <div className="empty-state" style={{ minHeight: 190 }}><div className="empty-icon"><FolderTree size={16} /></div><h3>No categories yet</h3><p>Categories are derived from diagnoses in saved sessions.</p></div> : <div className="category-list">{categories.slice(0, 5).map((category) => <div className="category-row" key={category.name}><span>{category.name}</span><strong>{category.count}</strong><div className="category-track"><span style={{ width: `${(category.count / maxCategory) * 100}%` }} /></div></div>)}</div>}
      </section>
    </div>

    <section className="panel activity-panel"><div className="panel-header"><span className="panel-title">Recent sessions</span><Link href="/app/sessions" className="panel-caption" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>All sessions <ArrowRight size={12} /></Link></div>
      {loading ? <div className="activity-row"><div className="skeleton" style={{ width: 25, height: 25 }} /><div className="skeleton" style={{ width: "55%", height: 12 }} /></div> : sessions.length === 0 ? <div className="empty-state"><div className="empty-icon"><Sparkles size={16} /></div><h3>Your workspace is ready</h3><p>Analyze a stack trace, then save the result here to start building a real debugging history.</p><Link href="/app/analyzer" className="button-quiet">Analyze an error <ArrowRight size={12} /></Link></div> : sessions.slice(0, 6).map((session) => <Link key={session.id} href="/app/sessions" className="activity-row">
        <span className="activity-icon"><Bug size={13} /></span><span className="activity-body"><span className="activity-title">{session.title}</span><span className="activity-subtitle">{session.category ?? "Uncategorized"} · {session.resolved ? "Resolved" : "Open"}</span></span><span className="activity-time">{relativeDate(session.createdAt)}</span>
      </Link>)}
    </section>
  </>;
}
