"use client";

import Link from "next/link";
import { Activity, ArrowRight, BarChart3, CheckCircle2, CircleHelp, PieChart as PieIcon, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSessions } from "@/lib/client";
import { categoryCounts, commonErrors, frequencyByDay } from "@/lib/analytics";

const colors = ["#a18ff7", "#78aaff", "#63d19a", "#e8bd6a", "#e98d9a", "#91909c"];

export default function AnalyticsPage() {
  const { sessions, loading, error } = useSessions();
  const categories = categoryCounts(sessions);
  const errors = commonErrors(sessions);
  const frequency = frequencyByDay(sessions, 30);
  const resolved = sessions.filter((session) => session.resolved).length;
  const resolutionRate = sessions.length ? Math.round((resolved / sessions.length) * 100) : 0;
  const recentCount = frequency.slice(-7).reduce((sum, point) => sum + point.count, 0);

  return <>
    <div className="page-heading"><div><h1>Analytics</h1><p>Trends and patterns from real saved debugging sessions.</p></div><span className="source-tag"><Activity size={11} /> Stored data only</span></div>
    {error && <div className="sandbox-unavailable" role="alert">{error}</div>}
    <div className="metric-grid">
      <article className="metric-card"><div className="metric-label"><span>Total sessions</span><span className="metric-icon"><BarChart3 size={13} /></span></div><div className="metric-value">{loading ? "—" : sessions.length}</div><div className="metric-note">All saved analyzer and playground sessions</div></article>
      <article className="metric-card"><div className="metric-label"><span>Resolved</span><span className="metric-icon"><CheckCircle2 size={13} /></span></div><div className="metric-value">{loading ? "—" : `${resolutionRate}%`}</div><div className="metric-note">{resolved} of {sessions.length} saved sessions</div></article>
      <article className="metric-card"><div className="metric-label"><span>Last 7 days</span><span className="metric-icon"><TrendingUp size={13} /></span></div><div className="metric-value">{loading ? "—" : recentCount}</div><div className="metric-note">Sessions created in the last week</div></article>
      <article className="metric-card"><div className="metric-label"><span>Recognized</span><span className="metric-icon"><PieIcon size={13} /></span></div><div className="metric-value">{loading ? "—" : sessions.filter((session) => session.diagnosis).length}</div><div className="metric-note">Saved sessions with a whycrash diagnosis</div></article>
    </div>
    <div className="analytics-grid" style={{ marginTop: 12 }}>
      <section className="panel"><div className="panel-header"><span className="panel-title">Session frequency</span><span className="panel-caption">Last 30 days</span></div><div className="chart-wrap" style={{ height: 260 }}>
        {loading ? <div className="skeleton" style={{ height: "100%" }} /> : sessions.length === 0 ? <div className="chart-empty"><div className="chart-empty-inner"><Activity size={20} /><span>Save a session to see the frequency trend.</span></div></div> : <ResponsiveContainer width="100%" height="100%"><BarChart data={frequency} margin={{ top: 7, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="#24232c" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#777581", fontSize: 8 }} interval={4} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#777581", fontSize: 8 }} width={28} />
          <Tooltip contentStyle={{ background: "#1a191f", border: "1px solid #393743", borderRadius: 5, color: "#d2d0da", fontSize: 9 }} />
          <Bar dataKey="count" name="Sessions" fill="#8978e8" radius={[3, 3, 0, 0]} maxBarSize={18} />
        </BarChart></ResponsiveContainer>}
      </div></section>
      <section className="panel"><div className="panel-header"><span className="panel-title">Error categories</span><span className="panel-caption">CrashLab metadata</span></div>
        {categories.length === 0 && !loading ? <div className="empty-state" style={{ minHeight: 218 }}><div className="empty-icon"><PieIcon size={16} /></div><h3>No category data yet</h3><p>Saved sessions get a CrashLab category based on their whycrash rule ID.</p></div> : <div className="category-list">{categories.map((category, index) => <div className="category-row" key={category.name}><span>{category.name}</span><strong>{category.count}</strong><div className="category-track"><span style={{ width: `${(category.count / Math.max(1, ...categories.map((item) => item.count))) * 100}%`, background: colors[index % colors.length] }} /></div></div>)}</div>}
      </section>
    </div>
    <div className="analytics-secondary">
      <section className="panel"><div className="panel-header"><span className="panel-title">Most common errors</span><span className="panel-caption">By saved message</span></div>{errors.length === 0 ? <div className="empty-state" style={{ minHeight: 145 }}><div className="empty-icon"><CircleHelp size={16} /></div><h3>No error patterns yet</h3><p>Save a few debugging sessions to see recurring messages.</p></div> : <div className="analytics-list">{errors.map((item, index) => <div key={item.name} className="analytics-list-row"><span><span className="feature-index" style={{ position: "static", display: "inline", marginRight: 8 }}>0{index + 1}</span>{item.name}</span><strong>{item.count}</strong></div>)}</div>}</section>
      <section className="panel"><div className="panel-header"><span className="panel-title">Resolution statistics</span><span className="panel-caption">Manual status updates</span></div><div className="resolution-summary"><div className="resolution-number">{loading ? "—" : `${resolved} / ${sessions.length}`}</div><p>Sessions marked resolved</p><div className="resolution-track"><span style={{ width: `${resolutionRate}%` }} /></div><div className="resolution-footer"><span>{resolutionRate}% resolved</span><Link href="/app/sessions">Review sessions <ArrowRight size={11} /></Link></div></div></section>
    </div>
  </>;
}
