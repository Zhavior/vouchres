'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  Search, 
  Filter, 
  ShieldCheck, 
  Lock, 
  Layers, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  BarChart2,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { PlayerCandidate, EvidenceItem } from '@/components/SlateMatrix';
import PitchVulnerabilityInspector, { PitchTypeTelemetry } from '@/components/hr-board/PitchVulnerabilityInspector';
import HypothesisLockModal from '@/components/hr-board/HypothesisLockModal';
import Footer from '@/components/Footer';

const FULL_BOARD_CANDIDATES: PlayerCandidate[] = [
  {
    id: 'BTR-514888',
    name: 'Pete Alonso',
    pos: '1B',
    team: 'BAL',
    opp: '@ TB',
    hand: 'R',
    pitcherOpp: 'Z. Eflin',
    pitcherHand: 'R',
    avgEv: 94.1,
    barrelPct: 14.1,
    hardHitPct: 56.0,
    pitchVuln: 70,
    parkBoost: 9.0,
    hrpi: 100,
    projHrPct: 14.0,
    auditScore: 100,
    evidenceItems: [
      { id: 'EV-01', layer: 'Lineup Confirmation', source: 'MLB Gameday Official API', status: 'verified', detail: 'Batting 4th · Clean bill of health', timestamp: '17:42:10 UTC' },
      { id: 'EV-02', layer: 'Pitch Vulnerability', source: 'Hawk-Eye 3D Telemetry (R vs R)', status: 'verified', detail: 'Cutter / Sinker dead-zone vulnerability index: 70/100', timestamp: '17:42:11 UTC' },
      { id: 'EV-03', layer: 'Park Factor Telemetry', source: 'Tropicana Field Static Spatial Model', status: 'verified', detail: 'Dome fixed-environment +9.0% RHH boost factor', timestamp: '17:42:11 UTC' },
      { id: 'EV-04', layer: 'Atmospheric Vector', source: 'NOAA Spatial Grid Sensor', status: 'missing', detail: 'Indoor venue · Atmospheric delta zeroed', timestamp: '17:42:12 UTC' }
    ]
  },
  {
    id: 'BTR-592450',
    name: 'Aaron Judge',
    pos: 'CF',
    team: 'NYY',
    opp: 'vs BOS',
    hand: 'R',
    pitcherOpp: 'B. Bello',
    pitcherHand: 'R',
    avgEv: 95.8,
    barrelPct: 16.2,
    hardHitPct: 61.4,
    pitchVuln: 82,
    parkBoost: 12.5,
    hrpi: 98,
    projHrPct: 15.2,
    auditScore: 100,
    evidenceItems: [
      { id: 'EV-06', layer: 'Lineup Confirmation', source: 'MLB Gameday Official API', status: 'verified', detail: 'Batting 2nd · Confirmed official', timestamp: '17:40:02 UTC' },
      { id: 'EV-07', layer: 'Pitch Vulnerability', source: 'Hawk-Eye 3D Telemetry (R vs R)', status: 'verified', detail: 'Sinker down-and-in ISO: .388 against profile', timestamp: '17:40:02 UTC' },
      { id: 'EV-08', layer: 'Atmospheric Vector', source: 'NOAA Station KNYC', status: 'verified', detail: 'Wind 11mph Out to RF · 74°F · 48% Humidity', timestamp: '17:40:03 UTC' }
    ]
  },
  {
    id: 'BTR-660271',
    name: 'Shohei Ohtani',
    pos: 'DH',
    team: 'LAD',
    opp: '@ SF',
    hand: 'L',
    pitcherOpp: 'L. Webb',
    pitcherHand: 'R',
    avgEv: 94.9,
    barrelPct: 15.0,
    hardHitPct: 58.2,
    pitchVuln: 64,
    parkBoost: -2.0,
    hrpi: 95,
    projHrPct: 13.6,
    auditScore: 100,
    evidenceItems: [
      { id: 'EV-10', layer: 'Lineup Confirmation', source: 'MLB Gameday Official API', status: 'verified', detail: 'Batting 1st · Confirmed official', timestamp: '17:35:10 UTC' },
      { id: 'EV-11', layer: 'Pitch Vulnerability', source: 'Hawk-Eye 3D Telemetry (L vs R)', status: 'verified', detail: 'Changeup bottom-third vulnerability: 64/100', timestamp: '17:35:11 UTC' }
    ]
  },
  {
    id: 'BTR-665742',
    name: 'Juan Soto',
    pos: 'RF',
    team: 'NYY',
    opp: 'vs BOS',
    hand: 'L',
    pitcherOpp: 'B. Bello',
    pitcherHand: 'R',
    avgEv: 93.4,
    barrelPct: 13.8,
    hardHitPct: 54.2,
    pitchVuln: 74,
    parkBoost: 14.0,
    hrpi: 94,
    projHrPct: 13.1,
    auditScore: 100,
    evidenceItems: [
      { id: 'EV-13', layer: 'Lineup Confirmation', source: 'MLB Gameday Official API', status: 'verified', detail: 'Batting 3rd · Confirmed official', timestamp: '17:40:02 UTC' }
    ]
  },
  {
    id: 'BTR-663586',
    name: 'Austin Riley',
    pos: '3B',
    team: 'ATL',
    opp: '@ PHI',
    hand: 'R',
    pitcherOpp: 'A. Nola',
    pitcherHand: 'R',
    avgEv: 92.8,
    barrelPct: 12.9,
    hardHitPct: 52.0,
    pitchVuln: 71,
    parkBoost: 8.5,
    hrpi: 91,
    projHrPct: 12.4,
    auditScore: 100,
    evidenceItems: [
      { id: 'EV-15', layer: 'Lineup Confirmation', source: 'MLB Gameday Official API', status: 'verified', detail: 'Batting 4th · Confirmed official', timestamp: '17:30:19 UTC' }
    ]
  },
  {
    id: 'BTR-605141',
    name: 'Mookie Betts',
    pos: 'SS',
    team: 'LAD',
    opp: '@ SF',
    hand: 'R',
    pitcherOpp: 'L. Webb',
    pitcherHand: 'R',
    avgEv: 91.4,
    barrelPct: 10.8,
    hardHitPct: 46.5,
    pitchVuln: 58,
    parkBoost: -2.0,
    hrpi: 88,
    projHrPct: 11.2,
    auditScore: 100,
    evidenceItems: [
      { id: 'EV-17', layer: 'Lineup Confirmation', source: 'MLB Gameday Official API', status: 'verified', detail: 'Batting 2nd · Confirmed', timestamp: '17:35:10 UTC' }
    ]
  },
  {
    id: 'BTR-673357',
    name: 'Luis Robert Jr.',
    pos: 'CF',
    team: 'CWS',
    opp: 'vs MIN',
    hand: 'R',
    pitcherOpp: 'P. López',
    pitcherHand: 'R',
    avgEv: 91.2,
    barrelPct: 11.5,
    hardHitPct: 47.0,
    pitchVuln: 69,
    parkBoost: 21.0,
    hrpi: 74,
    projHrPct: 9.8,
    auditScore: 92,
    evidenceItems: [
      { id: 'EV-19', layer: 'Lineup Confirmation', source: 'MLB Gameday Official API', status: 'verified', detail: 'Batting 3rd · Confirmed', timestamp: '17:15:00 UTC' }
    ]
  }
];

const MOCK_PITCH_TELEMETRY: Record<string, PitchTypeTelemetry[]> = {
  'Pete Alonso': [
    { pitchType: 'Sinker', usagePct: 38.4, pitcherVelocity: 94.2, batterIsoVsPitch: 0.312, batterHardHitVsPitch: 58.2, vulnerabilityIndex: 82, vulnerabilityTier: 'critical' },
    { pitchType: 'Cutter', usagePct: 29.1, pitcherVelocity: 88.6, batterIsoVsPitch: 0.280, batterHardHitVsPitch: 51.4, vulnerabilityIndex: 74, vulnerabilityTier: 'elevated' },
    { pitchType: 'Curveball', usagePct: 20.2, pitcherVelocity: 79.5, batterIsoVsPitch: 0.190, batterHardHitVsPitch: 42.0, vulnerabilityIndex: 51, vulnerabilityTier: 'neutral' },
    { pitchType: 'Changeup', usagePct: 12.3, pitcherVelocity: 85.1, batterIsoVsPitch: 0.145, batterHardHitVsPitch: 36.5, vulnerabilityIndex: 38, vulnerabilityTier: 'resistant' },
  ],
  'Aaron Judge': [
    { pitchType: '4-Seam Fastball', usagePct: 42.0, pitcherVelocity: 96.1, batterIsoVsPitch: 0.410, batterHardHitVsPitch: 64.0, vulnerabilityIndex: 92, vulnerabilityTier: 'critical' },
    { pitchType: 'Sweeper', usagePct: 31.5, pitcherVelocity: 84.2, batterIsoVsPitch: 0.320, batterHardHitVsPitch: 56.0, vulnerabilityIndex: 78, vulnerabilityTier: 'elevated' },
    { pitchType: 'Changeup', usagePct: 26.5, pitcherVelocity: 87.4, batterIsoVsPitch: 0.210, batterHardHitVsPitch: 44.0, vulnerabilityIndex: 48, vulnerabilityTier: 'neutral' },
  ],
};

export default function HrBoardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [handFilter, setHandFilter] = useState<'ALL' | 'R' | 'L'>('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<PlayerCandidate | null>(FULL_BOARD_CANDIDATES[0]);
  const [lockingCandidate, setLockingCandidate] = useState<PlayerCandidate | null>(null);
  const [lockedReceiptNotification, setLockedReceiptNotification] = useState<string | null>(null);

  const filteredCandidates = useMemo(() => {
    return FULL_BOARD_CANDIDATES.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.team.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesHand = handFilter === 'ALL' || c.hand === handFilter;
      return matchesSearch && matchesHand;
    });
  }, [searchQuery, handFilter]);

  const activePitchTelemetry = selectedCandidate ? (MOCK_PITCH_TELEMETRY[selectedCandidate.name] || MOCK_PITCH_TELEMETRY['Pete Alonso']) : [];

  const handleLockConfirmed = (receiptId: string) => {
    setLockingCandidate(null);
    setLockedReceiptNotification(receiptId);
    setTimeout(() => setLockedReceiptNotification(null), 5000);
  };

  return (
    <main className="min-h-screen bg-[#06070a] text-slate-300 font-sans selection:bg-emerald-500/20 selection:text-emerald-200">
      
      {/* Top Utility Nav */}
      <nav className="border-b border-white/[0.08] bg-[#06070a] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={13} />
              <span>Back to Overview</span>
            </Link>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-2 text-white font-medium">
              <div className="w-2 h-2 bg-emerald-500" />
              <span>HR COMMAND DESK (LIVE SLATE)</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <RefreshCw size={11} className="animate-spin text-emerald-400" />
              <span>15/15 GAMES SYNCED</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Notification Toast */}
      {lockedReceiptNotification && (
        <div className="fixed top-14 right-6 z-50 border border-emerald-500/30 bg-[#090b10] p-4 shadow-2xl font-mono text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <CheckCircle2 size={14} />
            Receipt Locked to Ledger
          </div>
          <div className="text-slate-300 mt-1">{lockedReceiptNotification}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Audit weight 100% committed pre-game.</div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border border-white/[0.08] bg-[#090b10] p-2.5 gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-[#06070a] border border-white/[0.06] px-3 py-1.5">
            <Search size={13} className="text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search candidate name or team (e.g. Alonso, NYY)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full font-mono"
            />
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-500 text-[11px] uppercase">Batter Hand:</span>
            <div className="flex border border-white/[0.06] bg-[#06070a] p-0.5">
              {(['ALL', 'R', 'L'] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => setHandFilter(h)}
                  className={`px-3 py-1 text-[11px] transition-colors ${handFilter === h ? 'bg-white/[0.08] text-white font-medium' : 'text-slate-400 hover:text-white'}`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Master Command Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Table Panel (8 cols) */}
          <div className="lg:col-span-8 border border-white/[0.08] bg-[#090b10]">
            <div className="border-b border-white/[0.08] bg-[#06070a] px-4 py-2.5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-200 font-semibold uppercase tracking-wider">Candidate Universe</span>
              <span className="text-slate-500">{filteredCandidates.length} Active Records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#06070a] text-slate-500 text-[11px] font-mono uppercase">
                    <th className="py-2.5 px-3 font-medium">Candidate</th>
                    <th className="py-2.5 px-2 font-medium">Matchup</th>
                    <th className="py-2.5 px-2 font-medium text-right">Avg EV</th>
                    <th className="py-2.5 px-2 font-medium text-right">Barrel%</th>
                    <th className="py-2.5 px-2 font-medium text-right">Vuln</th>
                    <th className="py-2.5 px-2 font-medium text-right">Park Δ</th>
                    <th className="py-2.5 px-2 font-medium text-right">HRPI</th>
                    <th className="py-2.5 px-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs font-mono">
                  {filteredCandidates.map((c) => {
                    const isSelected = selectedCandidate?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCandidate(c)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-white/[0.04] text-white' : 'hover:bg-white/[0.02] text-slate-300'}`}
                      >
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-medium text-slate-100 flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 ${isSelected ? 'bg-emerald-400' : 'bg-transparent'}`} />
                            {c.name}
                            <span className="text-[10px] font-mono text-slate-500">{c.hand}HB</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">{c.team} · {c.pos}</div>
                        </td>
                        <td className="py-2.5 px-2 text-slate-400">
                          <div>{c.opp}</div>
                          <div className="text-[10px] text-slate-500">vs {c.pitcherOpp}</div>
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-200">{c.avgEv.toFixed(1)}</td>
                        <td className="py-2.5 px-2 text-right text-slate-200">{c.barrelPct.toFixed(1)}%</td>
                        <td className="py-2.5 px-2 text-right text-amber-400 font-bold">{c.pitchVuln}</td>
                        <td className="py-2.5 px-2 text-right text-emerald-400">+{c.parkBoost.toFixed(1)}%</td>
                        <td className="py-2.5 px-2 text-right font-bold text-emerald-400">{c.hrpi}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLockingCandidate(c);
                            }}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-medium transition-colors"
                          >
                            Lock Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Inspector Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {selectedCandidate ? (
              <>
                {/* Candidate Overview Card */}
                <div className="border border-white/[0.08] bg-[#090b10] p-4 space-y-4">
                  <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">Selected Inspector</div>
                      <div className="text-lg font-semibold text-white font-sans mt-0.5">{selectedCandidate.name}</div>
                      <div className="text-xs font-mono text-slate-400">{selectedCandidate.team} · {selectedCandidate.opp}</div>
                    </div>
                    <button
                      onClick={() => setLockingCandidate(selectedCandidate)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold font-sans transition-colors"
                    >
                      Lock Hypothesis
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#06070a] border border-white/[0.06] p-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Projected HR%:</span>
                      <span className="text-white font-bold">{selectedCandidate.projHrPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">HRPI Score:</span>
                      <span className="text-emerald-400 font-bold">{selectedCandidate.hrpi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">HardHit%:</span>
                      <span className="text-slate-200">{selectedCandidate.hardHitPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Audit Form:</span>
                      <span className="text-emerald-400 font-bold">{selectedCandidate.auditScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Pitch Vulnerability Inspector */}
                <PitchVulnerabilityInspector
                  batterName={selectedCandidate.name}
                  pitcherName={selectedCandidate.pitcherOpp}
                  pitches={activePitchTelemetry}
                />
              </>
            ) : (
              <div className="border border-white/[0.08] bg-[#090b10] p-6 text-center text-xs font-mono text-slate-500">
                Select a batter from the candidate universe to inspect telemetry
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Lock Hypothesis Modal */}
      {lockingCandidate && (
        <HypothesisLockModal
          player={lockingCandidate}
          onClose={() => setLockingCandidate(null)}
          onLockConfirmed={handleLockConfirmed}
        />
      )}

      <Footer />
    </main>
  );
}
