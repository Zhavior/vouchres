'use client';

import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Cpu, 
  Database, 
  CheckCircle2, 
  Lock, 
  Hash, 
  Activity, 
  Flame, 
  Layers, 
  Compass,
  ArrowRight
} from 'lucide-react';

interface Chapter {
  id: string;
  step: string;
  title: string;
  tagline: string;
  body: string[];
  specs: { label: string; value: string; color?: string }[];
  visualType: 'BROKEN_PARADIGM' | 'DETERMINISTIC_ENGINE' | 'IMMUTABLE_LEDGER';
}

const CHAPTERS: Chapter[] = [
  {
    id: 'broken',
    step: '01 // THE BROKEN PARADIGM',
    title: 'Deleted Tweets, Survivorship Bias, and Blind Intuition.',
    tagline: 'The legacy sports tout ecosystem is engineered to conceal failure.',
    body: [
      'In the current market, public touts and retail services emit dozens of unweighted home run picks daily. Losing slips are quietly deleted. Winning longshots are amplified with retrospective hyperbole.',
      'Without an immutable, pre-lock cryptographic record, retail bettors are trading against manipulated track records, survivorship bias, and illusory winning streaks.'
    ],
    specs: [
      { label: 'INDUSTRY RETROACTIVE EDITS', value: 'FREQUENT / UNCHECKED', color: 'text-rose-500' },
      { label: 'SELECTIVE SURVIVORSHIP BIAS', value: '88.4%', color: 'text-amber-400' },
      { label: 'AUDITABLE PRE-GAME RECORD', value: '0.00%', color: 'text-rose-500' },
    ],
    visualType: 'BROKEN_PARADIGM'
  },
  {
    id: 'engine',
    step: '02 // THE DETERMINISTIC ENGINE',
    title: 'Aerodynamics, Statcast Vectorization, & Plate Physics.',
    tagline: 'We do not guess outcomes. We calculate physical probability envelopes.',
    body: [
      'Home runs are physical reactions dictated by three deterministic constants: launch velocity, impact vector angle, and aerodynamic drag coefficient.',
      'VouchEdge ingests sub-second Statcast optical tracking, overlaying real-time barometric pressure, relative humidity, outfield wind azimuths, and individual umpire strike-zone distortions to compute the exact HR Probability Index (HRPI).'
    ],
    specs: [
      { label: 'TRAJECTORY VECTORIZATION', value: 'SUB-SECOND OPTICAL', color: 'text-cyan-400' },
      { label: 'THERMODYNAMIC AIR DENSITY', value: 'INCLUDED (kg/m³)', color: 'text-emerald-400' },
      { label: 'EDGE FILTER THRESHOLD', value: 'HRPI ≥ 70.0', color: 'text-emerald-400' },
    ],
    visualType: 'DETERMINISTIC_ENGINE'
  },
  {
    id: 'ledger',
    step: '03 // THE IMMUTABLE AUDIT LEDGER',
    title: 'Cryptographic Pre-Lock Hashes. Verifiable on Merkle Trees.',
    tagline: 'Every prediction is SHA-256 sealed 60 minutes before first pitch.',
    body: [
      'Every single slate model output is combined into a cryptographic Merkle root and signed with our institutional private key exactly 60 minutes prior to first pitch.',
      'Once published to the ledger, modifying a pick is mathematically impossible. Wins and losses are judged against the immutable hash, establishing the only zero-trust record in sports analytics.'
    ],
    specs: [
      { label: 'HASH ALGORITHM', value: 'SHA-256 + ECDSA', color: 'text-emerald-400' },
      { label: 'PRE-LOCK CUTOFF', value: 'T-60 MIN MANDATORY', color: 'text-cyan-400' },
      { label: 'RETROACTIVE EDIT RISK', value: 'MATHEMATICALLY 0.0%', color: 'text-emerald-400' },
    ],
    visualType: 'IMMUTABLE_LEDGER'
  }
];

export const StorySection: React.FC = () => {
  const [activeChapter, setActiveChapter] = useState<number>(0);

  const current = CHAPTERS[activeChapter];

  return (
    <section id="scrollytelling" className="relative border-b border-white/[0.08] bg-[#06070a] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/[0.08] pb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">
              MANIFESTO // OPERATIONAL ARCHITECTURE
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              The Architecture of Determinism
            </h2>
          </div>
          <div className="mt-4 md:mt-0 font-mono text-xs text-slate-400">
            CHAPTER {activeChapter + 1} OF {CHAPTERS.length} // PRESENTATION_MODE
          </div>
        </div>

        {/* Presentation Layout */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* Chapter Selector Navigation (Desktop & Mobile) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {CHAPTERS.map((chap, idx) => {
                const isActive = activeChapter === idx;
                return (
                  <button
                    key={chap.id}
                    onClick={() => setActiveChapter(idx)}
                    className={`w-full text-left p-4 transition-all border font-mono ${
                      isActive 
                        ? 'border-emerald-500 bg-[#0e121a] text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                        : 'border-white/[0.08] bg-[#08090d] text-slate-400 hover:border-white/[0.2] hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {chap.step}
                      </span>
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
                    </div>
                    <div className="font-sans text-sm sm:text-base font-bold text-white">
                      {chap.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Micro Quick Fact Box */}
            <div className="border border-white/[0.08] bg-[#090b0e] p-4 font-mono text-xs">
              <div className="text-[10px] text-slate-400 uppercase">SYSTEM MANDATE</div>
              <p className="mt-1 text-slate-300">
                &ldquo;If a variable cannot be audited or cryptographically timestamped, it does not enter the VouchEdge deterministic engine.&rdquo;
              </p>
            </div>
          </div>

          {/* Active Chapter Live Telemetry Screen */}
          <div className="lg:col-span-7">
            <div className="border border-white/[0.12] bg-[#090b0f] p-6 min-h-[480px] flex flex-col justify-between">
              
              {/* Telemetry Header */}
              <div>
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-cyan-400"></span>
                    <span className="text-white font-bold uppercase tracking-wider">{current.step}</span>
                  </div>
                  <span className="text-slate-400">SYS_AUDIT_VERIFIED</span>
                </div>

                <div className="mt-5">
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">{current.tagline}</span>
                  <h3 className="mt-1 text-2xl font-bold text-white font-sans">{current.title}</h3>
                </div>

                {/* Narrative Body */}
                <div className="mt-4 space-y-3 font-sans text-sm text-slate-300 leading-relaxed">
                  {current.body.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Dynamic Interactive Visual Component depending on active chapter */}
              <div className="my-6 border border-white/[0.08] bg-[#050608] p-4">
                {current.visualType === 'BROKEN_PARADIGM' && (
                  <div className="font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-rose-400 border-b border-white/[0.06] pb-1">
                      <span className="flex items-center gap-1.5"><AlertOctagon className="h-3.5 w-3.5" /> LEGACY_TOUT_TRACE: DETECTED_DELETION</span>
                      <span className="text-[10px]">FAILED_AUDIT</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      [14:15:02] Post published: &ldquo;Lock of the century on Judge HR +240&rdquo;<br/>
                      [17:45:11] Game result: 0-4, 2 K. No HR.<br/>
                      [17:46:02] <span className="text-rose-400">HTTP 404 POST DELETED // Zero public accountability.</span>
                    </div>
                  </div>
                )}

                {current.visualType === 'DETERMINISTIC_ENGINE' && (
                  <div className="font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-cyan-400 border-b border-white/[0.06] pb-1">
                      <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> STATCAST_BALLISTIC_MATRIX</span>
                      <span className="text-[10px] text-emerald-400">SOLVED (Cd: 0.312)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
                      <div className="border border-white/[0.06] p-1.5">
                        <div className="text-slate-400">BAT EXIT</div>
                        <div className="text-white font-bold text-sm">96.2 MPH</div>
                      </div>
                      <div className="border border-white/[0.06] p-1.5">
                        <div className="text-slate-400">LAUNCH VECTOR</div>
                        <div className="text-cyan-400 font-bold text-sm">21.4°</div>
                      </div>
                      <div className="border border-white/[0.06] p-1.5">
                        <div className="text-slate-400">AIR DENSITY</div>
                        <div className="text-emerald-400 font-bold text-sm">1.182 kg/m³</div>
                      </div>
                    </div>
                  </div>
                )}

                {current.visualType === 'IMMUTABLE_LEDGER' && (
                  <div className="font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-emerald-400 border-b border-white/[0.06] pb-1">
                      <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> MERKLE_TREE_LEAF_01</span>
                      <span className="text-[10px] text-slate-400">BLOCK #489102</span>
                    </div>
                    <div className="text-[10px] text-slate-300 break-all bg-black/50 p-2 border border-white/[0.04]">
                      ROOT: 0x8f2d9c44b7a1e05d6812cb90a42f7781e9b204c8109283f0a12e<br/>
                      SIGNATURE: secp256k1:3045022100e4a...92b01<br/>
                      STATUS: <span className="text-emerald-400 font-bold">LOCKED PRE-FIRST-PITCH</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Specs Table Footer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-white/[0.08] pt-4 font-mono text-xs">
                {current.specs.map((sp, idx) => (
                  <div key={idx} className="border-l border-white/[0.08] pl-3">
                    <div className="text-[9px] uppercase text-slate-400">{sp.label}</div>
                    <div className={`mt-0.5 font-bold ${sp.color || 'text-white'}`}>{sp.value}</div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
