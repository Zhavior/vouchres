'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Activity, RefreshCw, Lock, Radio } from 'lucide-react';

export const HeaderNav: React.FC = () => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#06070a]/95 backdrop-blur-md">
      {/* Micro Status Top Ribbon */}
      <div className="flex h-6 items-center justify-between border-b border-white/[0.04] px-4 text-[10px] font-mono uppercase tracking-wider text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </span>
            SYS_STATUS: 270 BATTERS AUDITED
          </span>
          <span className="hidden md:inline-block text-white/[0.15]">|</span>
          <span className="hidden md:inline-block text-slate-300">MERKLE_ROOT: 0x8F2D9...7781</span>
          <span className="hidden lg:inline-block text-white/[0.15]">|</span>
          <span className="hidden lg:inline-block text-cyan-400">LATENCY: 11.2 MS</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-300">SLATE: 2026-08-23 MAIN</span>
          <span className="text-white/[0.2]">//</span>
          <span className="text-white font-medium">{utcTime || '18:35:00 UTC'}</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center border border-emerald-500/40 bg-emerald-950/20 text-emerald-400">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold tracking-tight text-white">VOUCH_EDGE</span>
              <span className="rounded-none border border-emerald-500/30 bg-emerald-500/10 px-1 py-0.2 font-mono text-[9px] font-semibold text-emerald-400">
                PROD-v2.4
              </span>
            </div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
              Institutional MLB HR Intelligence
            </p>
          </div>
        </div>

        {/* Action Jump Deck */}
        <nav className="hidden items-center gap-1 font-mono text-xs md:flex">
          <a
            href="#hero"
            className="px-3 py-1.5 text-slate-400 transition-colors hover:border-b hover:border-white hover:text-white"
          >
            [01 // TELEMETRY]
          </a>
          <a
            href="#scrollytelling"
            className="px-3 py-1.5 text-slate-400 transition-colors hover:border-b hover:border-white hover:text-white"
          >
            [02 // MANIFESTO]
          </a>
          <a
            href="#radar"
            className="px-3 py-1.5 text-slate-400 transition-colors hover:border-b hover:border-white hover:text-white"
          >
            [03 // RADAR_GLOBE]
          </a>
          <a
            href="#matrix"
            className="px-3 py-1.5 text-slate-400 transition-colors hover:border-b hover:border-white hover:text-white"
          >
            [04 // SLATE_MATRIX]
          </a>
          <a
            href="#audit"
            className="px-3 py-1.5 text-slate-400 transition-colors hover:border-b hover:border-white hover:text-white"
          >
            [05 // AUDIT_LEDGER]
          </a>
        </nav>

        {/* Verification Pill / Terminal CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 border border-white/[0.08] bg-[#0a0c10] px-2.5 py-1 font-mono text-[11px] text-slate-300">
            <Lock className="h-3 w-3 text-emerald-400" />
            <span>IMMUTABLE LOCK ACTIVE</span>
          </div>
          <a
            href="#matrix"
            className="group relative flex items-center gap-2 border border-emerald-500/60 bg-emerald-500/10 px-3.5 py-1.5 font-mono text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500 hover:text-black"
          >
            <span>[ENTER_TERMINAL]</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>
      </div>
    </header>
  );
};
