import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  ShieldCheck, 
  MapPin, 
  Github, 
  Mail, 
  Cpu, 
  Code2, 
  Layers, 
  Sparkles, 
  Check, 
  Copy, 
  ArrowUpRight, 
  ExternalLink,
  BookOpen,
  Activity
} from 'lucide-react';
import { FooterSection } from '../components/landing-v3';
import PublicNav from '../components/landing-v3/PublicNav';
import { AURORA_MAX_SHELL } from '../theme/auroraTokens';
import { BLOG_POSTS } from '../data/blog/posts';

const TECH_STACK = [
  { category: "Core Frontend", items: ["React 19", "TypeScript", "Vite", "Tailwind CSS", "Framer Motion"] },
  { category: "GPU & Graphics", items: ["WebGL Shaders", "Three.js", "Aurora Engine", "60fps HUD Canvas"] },
  { category: "Backend & Systems", items: ["Node.js / Express", "Supabase (PostgreSQL)", "Redis / Upstash", "SendGrid Email Pipeline"] },
  { category: "Quantitative Telemetry", items: ["MLB Statcast Live Feed", "HRPI Probability Engine", "Immutable Evidence Ledgers", "Weather & Vector Modeling"] },
];

export default function DevProfilePage() {
  const [copiedKey, setCopiedKey] = useState(false);
  const operatorKey = "0x7F8C91A2B4E5D6 // NODE-001-CAN";

  const handleCopyKey = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(operatorKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const authoredPosts = BLOG_POSTS.filter(p => p.author.toLowerCase().includes('boyd'));

  return (
    <div className={`ve-public-landing-root z8-app-shell ve-theme-transition bg-black font-z8 ${AURORA_MAX_SHELL}`} data-scroll-owner="document">
      <PublicNav />
      <div className="flex flex-col min-h-screen bg-black text-white pt-16 relative selection:bg-cyan-500 selection:text-black">
        
        {/* Subtle Background Cyber Grid */}
        <div 
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} 
        />

        <main className="flex-grow flex flex-col px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full max-w-5xl mx-auto relative z-10">
          
          {/* ============================================================ */}
          {/* OPERATOR HEADER CARD                                         */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="border border-white/15 bg-zinc-950/90 shadow-2xl p-6 sm:p-10 relative overflow-hidden mb-10"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/10">
              <div className="flex items-center gap-5">
                {/* Cyber Avatar Node */}
                <div className="relative">
                  <div className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-cyan-400/60 bg-gradient-to-br from-cyan-950/80 via-black to-zinc-950 flex items-center justify-center font-mono text-3xl font-black text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.25)]">
                    BRS
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-black"></span>
                  </span>
                </div>

                {/* Identity Details */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="border border-cyan-400/40 bg-cyan-950/40 px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-cyan-300">
                      OPERATOR #001
                    </span>
                    <span className="border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-emerald-300 flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      SYSTEM ONLINE
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                    Boyd R. Santos
                  </h1>
                  
                  <p className="text-zinc-400 font-mono text-xs sm:text-sm mt-1">
                    Founder & Chief Systems Architect @ <span className="text-white font-bold">VouchEdge</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <a
                  href="https://github.com/Zhavior"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 border border-white/15 bg-black px-4 py-2.5 font-mono text-xs font-bold text-white hover:border-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>

                <a
                  href="/contact"
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 border border-cyan-400 bg-cyan-400 text-black px-4 py-2.5 font-mono text-xs font-black uppercase tracking-wider hover:bg-cyan-300 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                >
                  <Mail className="w-4 h-4" />
                  <span>Transmit Comms</span>
                </a>
              </div>
            </div>

            {/* Quick Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs font-mono">
              <div className="flex items-center gap-2.5 text-zinc-400">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Dartmouth, Nova Scotia, Canada <span className="text-sm">🇨🇦</span></span>
              </div>

              <div className="flex items-center gap-2.5 text-zinc-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified Cryptographic Node</span>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 text-zinc-400">
                <button
                  onClick={handleCopyKey}
                  className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-cyan-300 transition-colors cursor-pointer"
                  title="Copy Operator Public Key"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Key Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{operatorKey}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* MANIFESTO & PHILOSOPHY                                       */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10"
          >
            <div className="lg:col-span-2 border border-white/10 bg-zinc-950/80 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-cyan-400">
                <Terminal className="w-4 h-4" />
                <span>Engineering Philosophy & Mission</span>
              </div>
              <h2 className="text-2xl font-black font-mono text-white">
                Zero Hallucinations. Pure Sourced Truth.
              </h2>
              <p className="text-sm text-zinc-400 font-mono leading-relaxed">
                I engineered VouchEdge because sports analytics has become plagued by fake "95% lock" models, erased bad picks, and opaque AI promises. 
              </p>
              <p className="text-sm text-zinc-400 font-mono leading-relaxed">
                My objective is simple: build high-density, low-latency telemetry for serious analysts who value mathematical truth over synthetic hype. When you place a pick on VouchEdge, it enters an immutable ledger that can never be rewritten.
              </p>
            </div>

            {/* Quick Metrics Bento Card */}
            <div className="border border-white/10 bg-zinc-950/80 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4 font-mono">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">PRIMARY DISPATCH</div>
                <div className="text-xl font-bold text-white">VouchEdge Ecosystem</div>
                <div className="text-xs text-cyan-400">vouchedge.xyz</div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Architecture:</span>
                  <span className="text-white font-bold">SPA + Express Hybrid</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Rendering:</span>
                  <span className="text-cyan-300 font-bold">GPU Aurora Pipeline</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Security:</span>
                  <span className="text-emerald-400 font-bold">SHA-256 Ledger Lock</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* TECHNICAL ARCHITECTURE MATRIX                                */}
          {/* ============================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="border border-white/10 bg-zinc-950/80 p-6 sm:p-8 mb-10"
          >
            <div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-cyan-400 mb-6">
              <Code2 className="w-4 h-4" />
              <span>Systems Architecture & Engineering Stack</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TECH_STACK.map((group, idx) => (
                <div key={idx} className="border border-white/5 bg-black/60 p-5 space-y-3">
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2">
                    {group.category}
                  </div>
                  <ul className="space-y-1.5 font-mono text-xs text-zinc-400">
                    {group.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-cyan-400">›</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ============================================================ */}
          {/* TRANSMISSIONS AUTHORED BY BOYD                               */}
          {/* ============================================================ */}
          {authoredPosts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="border border-white/10 bg-zinc-950/80 p-6 sm:p-8 mb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 font-mono text-xs font-black uppercase tracking-widest text-cyan-400">
                  <BookOpen className="w-4 h-4" />
                  <span>Transmissions Authored by Boyd</span>
                </div>
                <a href="/blog" className="font-mono text-xs text-zinc-500 hover:text-cyan-400 transition-colors uppercase">
                  View Full Archive →
                </a>
              </div>

              <div className="space-y-4">
                {authoredPosts.map(post => (
                  <a
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-white/5 bg-black/40 hover:border-cyan-400/50 transition-all no-underline"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
                        <span className="text-cyan-400 font-bold">{post.tag}</span>
                        <span>·</span>
                        <span>{post.date}</span>
                      </div>
                      <div className="text-base font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {post.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-cyan-400 shrink-0">
                      <span>Read Log</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          )}

        </main>

        <FooterSection />
      </div>
    </div>
  );
}
