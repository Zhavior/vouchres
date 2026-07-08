"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerminalCard, DataPoint } from '../components/Terminal';
import { VouchLedger } from '../components/Ledger';
import { MatchupIntelligence } from '../components/MatchupIntelligence';
import { PropTerminal } from '../components/PropTerminal';
import { ProfilePreview } from '../components/ProfilePreview';
import { MonetizationEngine } from '../components/Monetization';
import { DailySlate } from '../components/Slate';
import { Ticker } from '../components/Ticker';
import { useLiveTerminal } from '../hooks/useLiveTerminal';

export default function Home() {
  const [view, setView] = useState<'ledger' | 'matchup' | 'props' | 'profile' | 'money'>('ledger');
  const [selectedGame, setSelectedGame] = useState(1);
  const liveData = useLiveTerminal();

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white p-4 lg:p-12 relative overflow-hidden font-sans">
      <Ticker />
      <div className="absolute top-0 left-[-10%] w-[80%] h-full shohei-mask bg-[url('/shohei.png')] bg-no-repeat bg-contain opacity-10 pointer-events-none" />
      <div className="absolute inset-0 scanlines opacity-20 z-0" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
          <div className="text-xl font-bold tracking-tighter uppercase italic">VouchEdge<span className="text-[#00E5FF]">.Terminal</span></div>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            System_Status: <span className="text-emerald-400">Optimal</span> // Latency: {liveData.latency}ms
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Authority Copy */}
          <div className="lg:col-span-4 space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tighter leading-none">
              Command the board with <span className="text-[#00E5FF]">pristine</span> intelligence.
            </h1>
            <p className="text-white/40 text-sm leading-relaxed">
              The definitive research and verification terminal for serious analysts. Analyze live data, execute AI models, and prove your record.
            </p>
            <div className="space-y-4">
              <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Active_Daily_Slate</div>
              <DailySlate selectedId={selectedGame} onSelect={setSelectedGame} />
            </div>
            <button className="w-full bg-[#00E5FF] text-black py-4 font-bold uppercase text-xs tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(0,229,255,0.2)]">
              Initialize Terminal Access
            </button>
          </div>

          {/* Right: The Terminal Detail View */}
          <div className="lg:col-span-8">
            <TerminalCard>
              <div className="flex bg-white/5 p-1 border-b border-white/10">
                {['ledger', 'matchup', 'props', 'profile', 'money'].map(t => (
                  <button key={t} onClick={() => setView(t as any)} className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-widest transition-all ${view === t ? 'bg-[#00E5FF] text-black font-bold' : 'text-white/40 hover:text-white'}`}>
                    {t}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-3 border-b border-white/5 bg-black/40">
                <DataPoint label="Selected_Matchup" value={selectedGame === 1 ? "NYY @ LAD" : "PHI @ ATL"} />
                <DataPoint label="AI_Confidence" value={`${liveData.confidence}%`} active />
                <DataPoint label="Live_Line" value={`-115 → ${liveData.line}`} />
              </div>

              <div className="p-6 min-h-[400px] bg-black/20">
                <AnimatePresence mode="wait">
                  <motion.div key={view} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                    {view === 'ledger' && <VouchLedger />}
                    {view === 'matchup' && <MatchupIntelligence />}
                    {view === 'props' && <PropTerminal />}
                    {view === 'profile' && <ProfilePreview handle="EDGE_ANALYST" />}
                    {view === 'money' && <MonetizationEngine />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </TerminalCard>
          </div>
        </div>
      </div>
    </main>
  );
}
