"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BookOpen, ChartNoAxesCombined, ChevronLeft, ChevronRight, Command, FileClock, FlaskConical, Menu, Search, Settings2, ShieldCheck, X, Zap } from "lucide-react";

const navigation = [
  { label: "Overview", href: "/app", icon: Activity },
  { label: "Error analyzer", href: "/app/analyzer", icon: Zap, shortcut: "⌘1" },
  { label: "Crash playground", href: "/app/playground", icon: FlaskConical, shortcut: "⌘2" },
  { label: "Debugging sessions", href: "/app/sessions", icon: FileClock },
  { label: "Analytics", href: "/app/analytics", icon: ChartNoAxesCombined },
  { label: "Documentation", href: "/app/docs", icon: BookOpen },
  { label: "Settings", href: "/app/settings", icon: Settings2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const currentPage = navigation.find((item) => item.href === pathname) ?? navigation.find((item) => pathname.startsWith(`${item.href}/`)) ?? navigation[0]!;
  const matches = useMemo(() => navigation.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())), [query]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        setQuery("");
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "1") {
        event.preventDefault();
        router.push("/app/analyzer");
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "2") {
        event.preventDefault();
        router.push("/app/playground");
      }
      if (event.key === "Escape") { setPaletteOpen(false); setMobileOpen(false); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router]);

  return (
    <div className="app-frame">
      {mobileOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`app-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`} aria-label="Workspace navigation">
        <div className="app-brand-row">
          <Link className="app-brand" href="/app" onClick={() => setMobileOpen(false)}><span className="brand-symbol"><span /></span><span>crash<span className="brand-light">lab</span></span></Link>
          <button className="sidebar-toggle" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed((value) => !value)}>{collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}</button>
        </div>
        <div className="side-group-label"><span>WORKSPACE</span><Command size={12} /></div>
        <nav className="side-nav">
          {navigation.map(({ label, href, icon: Icon, shortcut }) => {
            const active = href === "/app" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} title={collapsed ? label : undefined} className={active ? "current" : ""} aria-current={active ? "page" : undefined} onClick={() => setMobileOpen(false)}><Icon size={15} strokeWidth={1.8} /><span>{label}</span>{shortcut && <span className="nav-shortcut">{shortcut}</span>}</Link>;
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-bottom">
          <Link href="/app/docs" className="engine-link" title={collapsed ? "whycrash engine" : undefined}><ShieldCheck size={15} /><span>whycrash engine</span></Link>
          <div className="sidebar-status"><ShieldCheck size={13} /><span>Deterministic, local-first diagnostics</span></div>
        </div>
      </aside>
      <div className={`app-main ${collapsed ? "expanded" : ""}`}>
        <header className="app-topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={16} /></button>
            <span className="workspace-label">CRASHLAB</span><span className="topbar-divider" />
            <div className="breadcrumbs"><span>Workspace</span><span>/</span><span>{currentPage.label}</span></div>
          </div>
          <div className="topbar-right">
            <span className="status-chip"><span className="green-dot" /> Local workspace</span>
            <button className="command-trigger" onClick={() => { setPaletteOpen(true); setQuery(""); }} aria-label="Open quick switcher"><Search size={12} /><span>Quick switch</span><kbd>⌘ K</kbd></button>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
      {paletteOpen && <div className="palette-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaletteOpen(false); }}>
        <section className="palette-dialog" role="dialog" aria-modal="true" aria-label="Quick switcher">
          <div className="palette-search"><Search size={16} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && matches[0]) window.location.href = matches[0].href; }} placeholder="Go to a page…" /><button className="icon-button" onClick={() => setPaletteOpen(false)} aria-label="Close quick switcher"><X size={14} /></button></div>
          <div className="palette-caption">PAGES</div>
          {matches.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className="palette-item" onClick={() => setPaletteOpen(false)}><Icon size={15} /><span>{label}</span><ChevronRight size={13} /></Link>)}
          {matches.length === 0 && <div className="palette-empty">No matching pages.</div>}
          <div className="palette-footer"><span><kbd>↵</kbd> Open page</span><span><kbd>esc</kbd> Close</span></div>
        </section>
      </div>}
    </div>
  );
}
