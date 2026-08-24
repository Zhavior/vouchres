import React, { useEffect, useRef } from 'react';
import { 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Database, 
  Globe2, 
  ShieldCheck, 
  XCircle,
  FileWarning,
  FileCheck2
} from 'lucide-react';
import createGlobe from 'cobe';
import { SlateMatrix } from '@/components/SlateMatrix';
import { ParkFactorRadar } from '@/components/ParkFactorRadar';
import { AuditLedgerStrip } from '@/components/AuditLedgerStrip';
import Footer from '@/components/Footer';

const StadiumGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;
    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, ({
      devicePixelRatio: 2,
      width: 800,
      height: 800,
      phi: 0,
      theta: -0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.03, 0.04, 0.06],
      markerColor: [0.06, 0.72, 0.50],
      glowColor: [0.03, 0.04, 0.06],
      markers: [
        { location: [39.284, -76.622], size: 0.08 },
        { location: [41.830, -87.634], size: 0.06 },
        { location: [33.445, -112.066], size: 0.07 },
        { location: [40.829, -73.926], size: 0.08 },
        { location: [34.073, -118.240], size: 0.09 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.002;
      },
    } as Parameters<typeof createGlobe>[1] & {
      onRender: (state: { phi?: number }) => void;
    }));

    return () => globe.destroy();
  }, []);

  return (
    <div className="relative w-full max-w-[400px] aspect-square mx-auto opacity-80 mix-blend-screen">
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', contain: 'layout paint size' }} 
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#080a0f_100%)] pointer-events-none" />
    </div>
  );
};

export default function VouchEdgeDesk() {
  return (
    <main className="min-h-screen bg-[#080a0f] text-slate-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-100">
      <nav className="border-b border-white/[0.08] bg-[#080a0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-medium tracking-tight">
            <ShieldCheck size={18} className="text-emerald-500" />
            <span>VouchEdge</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="/hr-board" className="hover:text-white transition-colors">Models</a>
            <a href="/hr-board" className="hover:text-white transition-colors">Ledger</a>
            <a href="/hr-board" className="hover:text-white transition-colors">Documentation</a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-20 space-y-32">
        {/* HERO SECTION */}
        <section className="grid lg:grid-cols-[1fr_1.1fr] gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-slate-400 tracking-widest uppercase">
              <Activity size={14} className="text-emerald-500" />
              Deterministic HRPI Model · 270 Batters Audited Daily
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-medium text-white tracking-tight leading-[1.1]">
                The First MLB Model That Refuses to Guess.
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                Formulate and lock auditable home run hypotheses across 15 active games using ground-truth Statcast telemetry, pitch vulnerabilities, and explicit coverage audit receipts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a href="/hr-board" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors">
                Launch HR Command Desk
                <ArrowRight size={16} />
              </a>
              <a href="/hr-board" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.08] text-white font-medium transition-colors">
                Inspect Audit Ledger
                <Database size={16} className="text-slate-400" />
              </a>
            </div>

            <div className="pt-6 border-t border-white/[0.08]">
              <div className="inline-flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  15 Games Active
                </div>
                <span className="text-white/[0.15]">|</span>
                <div className="text-slate-300">
                  <span className="font-mono text-white">270/270</span> Confirmed Lineups
                </div>
                <span className="text-white/[0.15]">|</span>
                <div className="text-slate-300">
                  <span className="font-mono text-white">14</span> Elite Tier Candidates
                </div>
              </div>
            </div>
          </div>

          {/* Interactive HUD Preview */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-2xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative bg-[#111622] border border-white/[0.08] border-t-white/[0.14] rounded-xl overflow-hidden shadow-2xl shadow-black/80 flex flex-col">
              <div className="px-5 py-3 border-b border-white/[0.08] bg-white/[0.02] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">BAL @ TB</span>
                  <span className="text-xs text-slate-500">Tropicana Field</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
                  <Activity size={12} />
                  Active Matchup Slate
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-medium text-white tracking-tight">Pete Alonso</h3>
                    <p className="text-sm text-slate-400 mt-1">BAL · 1B · Right Handed Batter</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                      HRPI 100 <span className="text-emerald-500/50">|</span> Elite Tier
                    </div>
                    <div className="text-sm text-slate-400">
                      Proj HR%: <span className="font-mono text-white text-base">14.0%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4 p-4 rounded-lg bg-[#080a0f] border border-white/[0.05]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider">Avg EV</span>
                    <span className="font-mono text-sm text-white">94.1 mph</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider">Barrel%</span>
                    <span className="font-mono text-sm text-white">14.1%</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider">Hard Hit</span>
                    <span className="font-mono text-sm text-white">56.0%</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider">Pitch Vuln</span>
                    <span className="font-mono text-sm text-amber-400">70</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider">Park Boost</span>
                    <span className="font-mono text-sm text-emerald-400">+9.0%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 border-t border-white/[0.08] bg-[#080a0f]/60 divide-x divide-white/[0.08]">
                <div className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-300">Lineup</span>
                    <span className="text-[10px] text-slate-500">Confirmed (MLB)</span>
                  </div>
                </div>
                <div className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-300">Telemetry</span>
                    <span className="text-[10px] text-slate-500">Statcast Synced</span>
                  </div>
                </div>
                <div className="p-4 flex flex-col items-center justify-center gap-2 text-center opacity-60">
                  <XCircle size={18} className="text-zinc-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-zinc-400">Weather</span>
                    <span className="text-[10px] text-zinc-500">Layer Unavailable</span>
                  </div>
                </div>
                <div className="p-4 flex flex-col items-center justify-center gap-2 text-center opacity-60">
                  <XCircle size={18} className="text-zinc-500" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-zinc-400">Bullpen</span>
                    <span className="text-[10px] text-zinc-500">Context Unavailable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3D STADIUM SLATE SECTION */}
        <section className="border-y border-white/[0.08] bg-[#111622]/30 py-16 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-emerald-500 font-mono text-sm">
                <Globe2 size={16} />
                <span>GEOSPATIAL TELEMETRY</span>
              </div>
              <h2 className="text-3xl font-medium text-white tracking-tight">
                Active Matchup Slate & Telemetry Nodes
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Real-time atmospheric and park factor data ingested directly from active MLB stadium coordinates. We map environmental variables against batter launch angle tendencies to isolate high-probability zones.
              </p>
              <ul className="space-y-3 pt-4">
                {['Camden Yards (BAL)', 'Guaranteed Rate Field (CWS)', 'Chase Field (ARI)'].map((stadium, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300 border-b border-white/[0.05] pb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{stadium}</span>
                    <span className="ml-auto font-mono text-xs text-slate-500">SYNCED</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">
              <StadiumGlobe />
            </div>
          </div>
        </section>

        {/* 4-TIER RADAR MATRIX */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-medium text-white tracking-tight">Live Slate Matrix</h2>
            <p className="text-slate-400">Interactive 4-tier hypothesis generation desk with real-time audit receipts.</p>
          </div>
          <SlateMatrix />
        </section>

        {/* PARK FACTORS RADAR */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-medium text-white tracking-tight">Environmental Park Factors</h2>
            <p className="text-slate-400">Live atmospheric conditions and historical HR boost metrics for all active venues.</p>
          </div>
          <ParkFactorRadar />
        </section>

        {/* AUDIT CONTRAST PROOF */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-medium text-white tracking-tight">
              The Audit Contrast Proof
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              The industry standard relies on deleted posts and hidden losses. VouchEdge enforces permanent, immutable receipts for every hypothesis generated.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-[#111622] border border-red-500/20 rounded-xl p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20" />
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                <div className="flex items-center gap-2 text-red-400 font-medium">
                  <FileWarning size={18} />
                  Standard Industry "Lock"
                </div>
                <span className="font-mono text-xs text-slate-500">14:30 EST</span>
              </div>
              <div className="space-y-4">
                <p className="text-slate-300 italic">
                  "Max units lock of the day! Trust the gut feeling on this one, he's due for a bomb. 🚀🔥"
                </p>
                <div className="p-4 rounded bg-red-500/5 border border-red-500/10 flex items-center justify-center gap-2 text-red-400/80 text-sm font-mono">
                  <XCircle size={16} />
                  [ POST DELETED POST-GAME ]
                </div>
              </div>
            </div>

            <div className="bg-[#111622] border border-emerald-500/20 border-t-emerald-500/40 rounded-xl p-6 space-y-6 relative shadow-[0_0_30px_-10px_rgba(16,185,129,0.1)]">
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <FileCheck2 size={18} />
                  VouchEdge Deterministic Receipt
                </div>
                <span className="font-mono text-xs text-slate-500">14:30 EST</span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-400">Hypothesis:</div>
                  <div className="text-white font-medium text-right">Alonso HR (BAL@TB)</div>
                  <div className="text-slate-400">Model Confidence:</div>
                  <div className="text-emerald-400 font-mono text-right">HRPI 100</div>
                  <div className="text-slate-400">Missing Layers:</div>
                  <div className="text-zinc-400 font-mono text-right">Weather, Bullpen</div>
                </div>
                <div className="p-4 rounded bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between text-sm">
                  <span className="text-emerald-400/80 font-mono">AUDIT WEIGHT: 100%</span>
                  <span className="text-slate-500 font-mono text-xs">PERMANENT RECORD</span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto pt-8">
            <AuditLedgerStrip />
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
