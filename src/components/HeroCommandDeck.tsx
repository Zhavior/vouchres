'use client';

import React from 'react';
import { 
  Crosshair, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Zap, 
  BarChart3, 
  Cpu, 
  Flame, 
  ArrowUpRight,
  Fingerprint
} from 'lucide-react';
import { BATTER_SLATE } from '@/data/mockData';

export const HeroCommandDeck: React.FC = () => {
  const alonso = BATTER_SLATE[0]; // Pete Alonso HRPI 100 record

  return (
    <section id="hero" className="relative border-b border-white/[0.08] bg-[#06070a] py-12 md:py-20">
      {/* Background Micro Grid */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          
          {/* LEFT COLUMN: Authoritative Institutional Hook */}
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              {/* Telemetry Tag */}
              <div className="inline-flex items-center gap-2 border border-white/[0.12] bg-[#0d1117] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-slate-300">
                <span className="h-1.5 w-1.5 bg-emerald-400 animate-pulse" />
                DETERMINISTIC SPORTS INTELLIGENCE // MLB STATCAST
              </div>

              {/* Mega Headline */}
              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                The First MLB Model That Refuses to Guess.
              </h1>

              {/* Subtitle */}
              <p className="mt-5 text-base leading-relaxed text-slate-300 font-sans sm:text-lg">
                VouchEdge isolates true home run variance by vectorizing Statcast bat-speed metrics, aerodynamic air density coefficients ($C_d$), and umpire zone skew into an immutable SHA-256 pre-game audit ledger. 
                <span className="text-white font-medium"> Zero social touts. Zero retroactive edits.</span>
              </p>

              {/* Strict Institutional Metrics Grid */}
              <div className="mt-8 grid grid-cols-3 gap-2 border-y border-white/[0.08] py-4 font-mono">
                <div>
                  <div className="text-[10px] uppercase text-slate-400">SLATE AUDIT</div>
                  <div className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl tabular-nums">
                    270 / 270
                  </div>
                  <div className="text-[9px] text-emerald-400">100% COVERAGE</div>
                </div>
                <div className="border-x border-white/[0.08] px-3">
                  <div className="text-[10px] uppercase text-slate-400">CAPTURE EDGE</div>
                  <div className="mt-1 text-xl font-bold tracking-tight text-emerald-400 sm:text-2xl tabular-nums">
                    +14.2%
                  </div>
                  <div className="text-[9px] text-slate-400">DISLOCATED ODDS</div>
                </div>
                <div className="pl-2">
                  <div className="text-[10px] uppercase text-slate-400">TAMPER LOG</div>
                  <div className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl tabular-nums">
                    0.00%
                  </div>
                  <div className="text-[9px] text-cyan-400">MERKLE VERIFIED</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#matrix"
                  className="flex items-center justify-center gap-2 border border-emerald-500 bg-emerald-500 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <Crosshair className="h-4 w-4" />
                  <span>INSPECT_SLATE_MATRIX</span>
                </a>
                <a
                  href="#scrollytelling"
                  className="flex items-center justify-center gap-2 border border-white/[0.12] bg-[#0a0c10] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-slate-300 transition-colors hover:border-white hover:text-white"
                >
                  <span>HOW DETERMINISM WORKS</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Live Feed Heartbeat Strip */}
            <div className="mt-8 border-t border-white/[0.06] pt-3 text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400 font-semibold">[LIVE_FEED]</span> Ballpark atmospheric drag computed: Philadelphia 1.182 kg/m³ (+9% boost), Denver 0.984 kg/m³ (+28% boost).
            </div>
          </div>

          {/* RIGHT COLUMN: Dense Real-time Command Deck Card for Pete Alonso (HRPI 100) */}
          <div className="lg:col-span-6">
            <div className="border border-white/[0.12] bg-[#090b0e] p-5 shadow-2xl relative">
              {/* Corner crosshairs */}
              <div className="absolute -top-1 -left-1 text-slate-400 font-mono text-[10px]">+</div>
              <div className="absolute -top-1 -right-1 text-slate-400 font-mono text-[10px]">+</div>
              <div className="absolute -bottom-1 -left-1 text-slate-400 font-mono text-[10px]">+</div>
              <div className="absolute -bottom-1 -right-1 text-slate-400 font-mono text-[10px]">+</div>

              {/* Card Header Strip */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 font-mono">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-emerald-400"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    LIVE_COMMAND_DECK // BATTER_ALPHA_01
                  </span>
                </div>
                <span className="border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  HRPI: 100.0 (MAX_INDEX)
                </span>
              </div>

              {/* Target Profile Bar */}
              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">TARGET ACQUISITION</div>
                  <h2 className="text-2xl font-black tracking-tight text-white font-sans sm:text-3xl">
                    {alonso.name}
                  </h2>
                  <div className="mt-0.5 font-mono text-xs text-slate-300">
                    <span className="text-emerald-400">{alonso.team}</span> vs {alonso.opponent} // {alonso.pitcher}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] uppercase text-slate-400">MARKET DISLOCATION</div>
                  <div className="text-xs text-slate-300 line-through">MKT: {alonso.impliedOdds}</div>
                  <div className="text-lg font-bold text-emerald-400">EDGE: {alonso.modelOdds} ({alonso.edgePct}%)</div>
                </div>
              </div>

              {/* Coverage Audit Warning Bars (EXPLICIT REQUIREMENT) */}
              <div className="mt-4 space-y-1.5 border border-amber-500/30 bg-amber-500/5 p-2.5 font-mono text-xs">
                <div className="flex items-center justify-between text-amber-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    AUDIT_FLAG: COVERAGE_INCOMPLETE
                  </span>
                  <span className="text-[10px] border border-amber-500/40 px-1 py-0.2">RESTRICTED_BET_SIZE</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="flex items-center justify-between border-r border-white/[0.08] pr-2">
                    <span className="text-slate-400">Weather Telemetry:</span>
                    <span className="font-bold text-amber-400">Missing (Radar Delay)</span>
                  </div>
                  <div className="flex items-center justify-between pl-1">
                    <span className="text-slate-400">Bullpen Fatigue:</span>
                    <span className="font-bold text-amber-400">Missing (No Roster Lock)</span>
                  </div>
                </div>
              </div>

              {/* Statcast Telemetry 4-Metric Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono">
                <div className="border border-white/[0.08] bg-[#0c0e14] p-2.5">
                  <div className="text-[9px] uppercase text-slate-400">Avg Exit Velo</div>
                  <div className="mt-1 text-lg font-bold text-white tabular-nums">{alonso.avgExitVelo} <span className="text-xs font-normal text-slate-400">mph</span></div>
                  <div className="text-[9px] text-emerald-400 font-semibold">97th Percentile</div>
                </div>
                <div className="border border-white/[0.08] bg-[#0c0e14] p-2.5">
                  <div className="text-[9px] uppercase text-slate-400">Barrel %</div>
                  <div className="mt-1 text-lg font-bold text-white tabular-nums">{alonso.barrelPct}%</div>
                  <div className="text-[9px] text-emerald-400 font-semibold">Threshold: &gt;12.5%</div>
                </div>
                <div className="border border-white/[0.08] bg-[#0c0e14] p-2.5">
                  <div className="text-[9px] uppercase text-slate-400">Pitch Vuln</div>
                  <div className="mt-1 text-lg font-bold text-cyan-400 tabular-nums">{alonso.pitchVuln} <span className="text-xs font-normal text-slate-400">/ 100</span></div>
                  <div className="text-[9px] text-slate-400">vs 4-Seam / Sinker</div>
                </div>
                <div className="border border-white/[0.08] bg-[#0c0e14] p-2.5">
                  <div className="text-[9px] uppercase text-slate-400">Park Boost</div>
                  <div className="mt-1 text-lg font-bold text-emerald-400 tabular-nums">+{alonso.parkBoostPct}%</div>
                  <div className="text-[9px] text-slate-400">CBP Outfield LF</div>
                </div>
              </div>

              {/* Sub-Telemetry Matrix & Launch Angle Distribution */}
              <div className="mt-3 border border-white/[0.08] bg-[#0c0e14] p-3 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 border-b border-white/[0.04] pb-1.5 mb-2 text-[10px]">
                  <span>ISOLATED POWER (ISO) VS PITCH CLUSTER</span>
                  <span className="text-white">.284 ISO (EXTREME)</span>
                </div>
                {/* Visual Density Bar */}
                <div className="h-2 w-full bg-slate-900 overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: '42%' }} title="Sweet Spot 25°-35°"></div>
                  <div className="h-full bg-cyan-500" style={{ width: '28%' }} title="Line Drive 10°-25°"></div>
                  <div className="h-full bg-amber-500" style={{ width: '18%' }} title="Ground Ball <10°"></div>
                  <div className="h-full bg-slate-700" style={{ width: '12%' }} title="Pop-up >35°"></div>
                </div>
                <div className="mt-2 flex justify-between text-[9px] text-slate-400">
                  <span>SWET_SPT: 42%</span>
                  <span>MED_LA: 18.4°</span>
                  <span>UMP_BOOST: +8.0%</span>
                  <span>BALLISTIC_PROJ: 418 FT</span>
                </div>
              </div>

              {/* Cryptographic SHA-256 Proof Stamp */}
              <div className="mt-3 flex items-center justify-between border border-white/[0.06] bg-[#06070a] px-3 py-2 font-mono text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <Fingerprint className="h-3 w-3 text-cyan-400 shrink-0" />
                  <span className="truncate">HASH: {alonso.sha256Hash}</span>
                </div>
                <span className="shrink-0 text-emerald-400 font-bold ml-2">[IMMUTABLE_PRE_LOCK]</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
