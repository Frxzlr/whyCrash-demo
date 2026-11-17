"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CircleDot, Command, GitBranch, Package, ShieldCheck, Sparkles, TerminalSquare, Zap } from "lucide-react";

const previews = [
  {
    label: "Property access",
    error: "TypeError: Cannot read properties of undefined (reading 'map')",
    title: "response.users is undefined",
    explanation: "Your code reads .map from response.users, but that value is undefined at this point.",
    fix: "Default it to an empty array: (response.users ?? []).map",
    location: "src/api/users.ts:18:29",
    color: "violet",
  },
  {
    label: "Connection refused",
    error: "TypeError: fetch failed · cause: ECONNREFUSED",
    title: "Nothing is accepting connections on localhost:5432",
    explanation: "The database connection was refused. The service may be stopped or listening on a different port.",
    fix: "Start Postgres, then check DATABASE_URL and its port.",
    location: "src/db/client.ts:7:21",
    color: "blue",
  },
];

export function LandingPage() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const preview = previews[active]!;

  async function copyPreviewFix() {
    try {
      await navigator.clipboard.writeText(preview.fix);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="landing">
      <header className="landing-nav">
        <Link href="/" className="brand-lockup" aria-label="CrashLab home">
          <span className="brand-symbol"><span /></span>
          <span>crash<span className="brand-light">lab</span></span>
        </Link>
        <nav className="landing-links" aria-label="Main navigation">
          <a href="#product">Product</a>
          <a href="#workflow">How it works</a>
          <a href="https://github.com/Frxzlr/Npm-Package" target="_blank" rel="noreferrer">whycrash <ArrowUpRight size={13} /></a>
        </nav>
        <Link href="/app" className="button button-nav">Open workspace <ArrowRight size={15} /></Link>
      </header>

      <section className="hero section-wrap">
        <div className="hero-copy">
          <motion.div className="eyebrow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <span className="eyebrow-pulse" />
            NODE.JS ERROR INTELLIGENCE
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
            Understand<br /><span>every crash.</span>
          </motion.h1>
          <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.13 }}>
            Your intelligent Node.js debugging workspace. Turn stack traces into clear causes and useful next steps.
          </motion.p>
          <motion.div className="hero-actions" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.2 }}>
            <Link href="/app/analyzer" className="button button-primary">Start debugging <ArrowRight size={16} /></Link>
            <a href="#product" className="text-link">Explore the workspace <ArrowDown size={15} /></a>
          </motion.div>
          <div className="hero-proof"><span><Check size={13} /> Runs locally</span><span><Check size={13} /> No AI required</span><span><Check size={13} /> Powered by whycrash</span></div>
        </div>

        <motion.div className="hero-terminal" initial={{ opacity: 0, y: 22, rotate: 0.6 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
          <div className="terminal-top"><div className="traffic-lights"><i /><i /><i /></div><span>api-server · node</span><span className="terminal-live"><span /> example output</span></div>
          <div className="terminal-body">
            <div className="terminal-line"><span className="terminal-number">1</span><span><b className="code-violet">const</b> names = response.users.<b className="code-blue">map</b>(user =&gt; user.name)</span></div>
            <div className="terminal-line"><span className="terminal-number">2</span><span><b className="code-violet">console</b>.log(names)</span></div>
            <div className="terminal-error"><span>×</span> TypeError: Cannot read properties of undefined (reading &apos;map&apos;)</div>
            <div className="diagnosis-card">
              <div className="diagnosis-heading"><span className="diagnosis-mark"><Sparkles size={14} /></span><span>whycrash diagnosis</span><span className="confidence">HIGH CONFIDENCE</span></div>
              <h3>`response.users` is undefined</h3>
              <p>Your code reads <code>.map</code> from <code>response.users</code>, but that value is undefined here.</p>
              <div className="terminal-fix"><span>TRY</span><code>response.users ?? []</code><ArrowRight size={13} /></div>
              <div className="terminal-location"><CircleDot size={12} /> src/api/users.ts <span>18:29</span></div>
            </div>
          </div>
          <div className="terminal-foot"><span><span className="green-dot" /> sample diagnosis</span><span>whycrash</span></div>
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        </motion.div>
      </section>

      <div className="trust-strip section-wrap"><span>THE DIAGNOSTIC ENGINE IS</span><b><Package size={15} /> whycrash</b><span className="trust-divider" /><span>DETERMINISTIC</span><span>OFFLINE-FIRST</span><span>OPEN SOURCE</span></div>

      <section className="product-section section-wrap" id="product">
        <div className="section-heading"><span className="eyebrow">INTERACTIVE PRODUCT PREVIEW · EXAMPLE INPUT</span><h2>Go from <span>what broke</span><br />to what to do next.</h2><p>One workspace for diagnosing errors, testing fixes and keeping your debugging history close.</p></div>
        <div className="preview-shell">
          <div className="preview-sidebar">
            <div className="preview-brand"><span className="brand-symbol small"><span /></span> crashlab</div>
            <div className="preview-workspace">WORKSPACE <Command size={12} /></div>
            <div className="preview-nav active"><Zap size={14} /> Error analyzer <span>⌘ 1</span></div>
            <div className="preview-nav"><TerminalSquare size={14} /> Crash playground</div>
            <div className="preview-nav"><CircleDot size={14} /> Sessions</div>
            <div className="preview-nav"><Sparkles size={14} /> Analytics</div>
            <div className="preview-sidebar-bottom"><ShieldCheck size={14} /><span>Diagnoses stay on your machine</span></div>
          </div>
          <div className="preview-main">
            <div className="preview-header"><div><span>WORKSPACE</span><b>/ Error analyzer</b></div><span className="preview-shortcut">⌘ K <span>Quick switch</span></span></div>
            <div className="preview-content">
              <div className="preview-title-row"><div><div className="eyebrow">ANALYSIS WORKSPACE</div><h3>What went wrong?</h3><p>Paste a Node.js error. whycrash will trace it back to a likely cause.</p></div><span className="engine-badge"><span /> WHYCRASH ENGINE</span></div>
              <div className="preview-analyzer">
                <div className="preview-input-label">STACK TRACE <span>↵ pasted input</span></div>
                <div className="preview-input-code"><span>TypeError: Cannot read properties of undefined (reading &apos;map&apos;)</span><br /><span className="muted-code">    at loadUsers (src/api/users.ts:18:29)</span><br /><span className="muted-code">    at async GET (src/app/api/users/route.ts:12:16)</span></div>
                <div className="preview-analyze-row"><span><kbd>⌘</kbd><kbd>↵</kbd> to analyze</span><Link href="/app/analyzer" className="button button-primary small-button">Analyze error <ArrowRight size={14} /></Link></div>
              </div>
              <div className="preview-result">
                <div className="result-kicker"><span className="result-check"><Check size={13} /></span> ANALYSIS COMPLETE <span className="confidence">HIGH CONFIDENCE</span></div>
                <h4>{preview.title}</h4>
                <p>{preview.explanation}</p>
                <div className="preview-fix"><span>01</span><code>{preview.fix}</code><button onClick={() => void copyPreviewFix()} aria-label="Copy suggested fix" title="Copy suggested fix">{copied ? "Copied" : "⧉"}</button></div>
                <div className="preview-result-foot"><span><CircleDot size={12} /> {preview.location}</span><span>WHYCRASH RULE · {active === 0 ? "PROPERTY-OF-UNDEFINED" : "CONNECTION-REFUSED"}</span></div>
              </div>
              <div className="preview-switch" aria-label="Preview sample selector">{previews.map((item, index) => <button key={item.label} onClick={() => setActive(index)} className={active === index ? "selected" : ""}>{item.label}</button>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="workflow-section section-wrap" id="workflow">
        <div className="workflow-head"><div><span className="eyebrow">BUILT FOR THE MOMENT AFTER THE CRASH</span><h2>Debug with more<br />context, less guesswork.</h2></div><p>whycrash inspects Node.js errors using deterministic rules. CrashLab gives you a focused place to explore what it finds.</p></div>
        <div className="feature-grid">
          <article className="feature-card feature-card-wide"><div className="feature-icon purple"><Zap size={18} /></div><span className="feature-index">01 / ANALYZE</span><h3>Find the reason behind the stack.</h3><p>Paste terminal output and get a confidence-rated diagnosis from whycrash, with real locations and next steps when the package can identify them.</p><div className="feature-foot"><Check size={13} /> Deterministic rules. No AI required.</div></article>
          <article className="feature-card"><div className="feature-icon blue"><TerminalSquare size={18} /></div><span className="feature-index">02 / EXPERIMENT</span><h3>Try the fix in a contained runtime.</h3><p>Explore curated examples in Monaco. Playground execution uses a short-lived Docker container with network disabled.</p><div className="feature-foot"><ShieldCheck size={13} /> Docker required for execution.</div></article>
          <article className="feature-card"><div className="feature-icon green"><CircleDot size={18} /></div><span className="feature-index">03 / REMEMBER</span><h3>Keep the debugging trail.</h3><p>Save analyses, mark issues resolved and see your own error patterns over time.</p><div className="feature-foot"><Package size={13} /> PostgreSQL or local file storage.</div></article>
        </div>
      </section>

      <section className="whycrash-band section-wrap"><div className="whycrash-badge"><Package size={19} /></div><div><span className="eyebrow">THE ENGINE UNDER THE HOOD</span><h2>Built around <span>whycrash.</span></h2><p>A local-first Node.js diagnostic package that investigates the code, files and packages around an error — then explains the most likely cause.</p></div><div className="whycrash-links"><a href="https://github.com/Frxzlr/Npm-Package" target="_blank" rel="noreferrer"><GitBranch size={16} /> Source code <ArrowUpRight size={13} /></a><a href="https://www.npmjs.com/package/whycrash" target="_blank" rel="noreferrer"><Package size={16} /> npm package <ArrowUpRight size={13} /></a></div></section>

      <section className="final-cta section-wrap"><span className="eyebrow"><span className="eyebrow-pulse" /> YOUR NEXT DEBUGGING SESSION</span><h2>Make the next error<br /><span>make more sense.</span></h2><Link href="/app/analyzer" className="button button-primary">Open CrashLab <ArrowRight size={16} /></Link><span className="cta-note">No account setup. No API key. Just start with the stack trace.</span></section>

      <footer className="landing-footer section-wrap"><Link href="/" className="brand-lockup"><span className="brand-symbol"><span /></span><span>crash<span className="brand-light">lab</span></span></Link><span>Developer diagnostics, in focus.</span><div><a href="https://github.com/Frxzlr/Npm-Package" target="_blank" rel="noreferrer">GitHub</a><a href="https://www.npmjs.com/package/whycrash" target="_blank" rel="noreferrer">npm</a><Link href="/app/docs">Documentation</Link></div><span>© {new Date().getFullYear()} CrashLab</span></footer>
    </main>
  );
}
