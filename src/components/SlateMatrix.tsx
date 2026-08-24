'use client';

import React, { useState } from 'react';
import { 
  Table, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  X, 
  Fingerprint, 
  ChevronRight, 
  Crosshair,
  Info,
  Layers,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import { BATTER_SLATE } from '@/data/mockData';
import { BatterRecord, ConfidenceTier } from '@/types/intelligence';

export const SlateMatrix: React.FC = () => {
  const [selectedBatter, setSelectedBatter] = useState<BatterRecord | null>(BATTER_SLATE[0]);
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const filteredBatters = BATTER_SLATE.filter((b) => {
    const matchesTier = tierFilter === 'ALL' || b.tier === tierFilter;
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const handleRowClick = (batter: BatterRecord) => {
    setSelectedBatter(batter);
    setDrawerOpen(true);
  };

  return (
    <section id="matrix" className="relative border-b border-white/[0.08] bg-[#06070a] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/[0.08] pb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">
              QUANTITATIVE SLATE AUDIT // 4 CONFIDENCE TIERS
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Verified Slate Matrix
            </h2>
          </div>
          <div className="mt-4 md:mt-0 font-mono text-xs text-slate-400">
            AUDITED_UNIVERSE: 270 BATTERS // ACTIVE_EDGES: {BATTER_SLATE.length}
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs">
          {/* Tier Tabs */}
          <div className="flex flex-wrap gap-1">
            {['ALL', 'ELITE', 'STRONG', 'VALUE', 'SLEEPER'].map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`border px-3 py-1.5 font-bold uppercase transition-colors ${
                  tierFilter === tier
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/[0.08] bg-[#0a0c10] text-slate-400 hover:text-white'
                }`}
              >
                [{tier}]
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="SEARCH BATTER, TEAM, OR VENUE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-72 border border-white/[0.08] bg-[#090b0e] py-1.5 pl-9 pr-3 text-xs font-mono text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Institutional High-Density Data Grid */}
        <div className="mt-4 border border-white/[0.08] bg-[#08090d] overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-white/[0.08] bg-[#0c0e14] text-[10px] uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="p-3">STATUS</th>
                <th className="p-3">BATTER / MATCHUP</th>
                <th className="p-3">TIER</th>
                <th className="p-3 text-right">HRPI</th>
                <th className="p-3 text-right">AVG EV</th>
                <th className="p-3 text-right">BARREL%</th>
                <th className="p-3 text-right">PARK BOOST</th>
                <th className="p-3 text-right">MKT / TRUE ODDS</th>
                <th className="p-3 text-right">NET EDGE</th>
                <th className="p-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredBatters.map((batter) => {
                const isSelected = selectedBatter?.id === batter.id;
                const isFlagged = batter.auditStatus === 'FLAGGED_MISSING_COVERAGE';

                return (
                  <tr
                    key={batter.id}
                    onClick={() => handleRowClick(batter)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/20'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Status Pill */}
                    <td className="p-3 whitespace-nowrap">
                      {isFlagged ? (
                        <span className="inline-flex items-center gap-1 border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          FLAGGED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          VERIFIED
                        </span>
                      )}
                    </td>

                    {/* Batter Details */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-sans font-bold text-white text-sm">{batter.name}</div>
                      <div className="text-[10px] text-slate-400">{batter.team} {batter.opponent} // {batter.venue}</div>
                    </td>

                    {/* Tier */}
                    <td className="p-3 whitespace-nowrap">
                      <span className={`text-[10px] font-bold ${
                        batter.tier === 'ELITE' ? 'text-emerald-400' :
                        batter.tier === 'STRONG' ? 'text-cyan-400' :
                        batter.tier === 'VALUE' ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {batter.tier}
                      </span>
                    </td>

                    {/* HRPI */}
                    <td className="p-3 whitespace-nowrap text-right font-bold text-emerald-400 tabular-nums">
                      {batter.hrpi.toFixed(1)}
                    </td>

                    {/* Avg EV */}
                    <td className="p-3 whitespace-nowrap text-right text-white tabular-nums">
                      {batter.avgExitVelo} mph
                    </td>

                    {/* Barrel% */}
                    <td className="p-3 whitespace-nowrap text-right text-white tabular-nums">
                      {batter.barrelPct}%
                    </td>

                    {/* Park Boost */}
                    <td className="p-3 whitespace-nowrap text-right text-cyan-400 tabular-nums">
                      +{batter.parkBoostPct}%
                    </td>

                    {/* Odds */}
                    <td className="p-3 whitespace-nowrap text-right tabular-nums">
                      <span className="text-slate-400 line-through mr-2">{batter.impliedOdds}</span>
                      <span className="text-white font-bold">{batter.modelOdds}</span>
                    </td>

                    {/* Edge % */}
                    <td className="p-3 whitespace-nowrap text-right font-bold text-emerald-400 tabular-nums">
                      +{batter.edgePct}%
                    </td>

                    {/* Inspect Button */}
                    <td className="p-3 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(batter);
                        }}
                        className="border border-white/[0.12] bg-[#0c0e14] px-2 py-1 text-[10px] text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
                      >
                        [INSPECT]
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Side Compliance Evidence Slide-out Drawer */}
        {drawerOpen && selectedBatter && (
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] border-l border-white/[0.12] bg-[#080a0f] p-6 shadow-2xl overflow-y-auto font-mono">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase">
                  COMPLIANCE_EVIDENCE_DRAWER
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="border border-white/[0.1] p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Target Specimen */}
            <div className="mt-5 border-b border-white/[0.08] pb-4">
              <div className="text-[10px] text-slate-400 uppercase">SPECIMEN ID: {selectedBatter.id}</div>
              <h3 className="mt-1 text-2xl font-black text-white font-sans">{selectedBatter.name}</h3>
              <div className="text-xs text-emerald-400 mt-0.5">
                {selectedBatter.team} vs {selectedBatter.opponent} // {selectedBatter.pitcher}
              </div>
            </div>

            {/* Multi-Source Stream Coverage Inspection */}
            <div className="mt-5 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                1. MULTI-SOURCE TELEMETRY VERIFICATION
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between border border-white/[0.06] bg-[#0c0e14] p-2.5">
                  <span className="text-slate-400">Statcast Optical Bat-Tracking</span>
                  <span className="text-emerald-400 font-bold">[VERIFIED_94.1_MPH]</span>
                </div>
                <div className="flex items-center justify-between border border-white/[0.06] bg-[#0c0e14] p-2.5">
                  <span className="text-slate-400">Doppler Ballistics / Barometrics</span>
                  <span className={selectedBatter.weatherCoverage === 'MISSING' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    [{selectedBatter.weatherCoverage === 'MISSING' ? 'FLAGGED_MISSING' : 'VERIFIED'}]
                  </span>
                </div>
                <div className="flex items-center justify-between border border-white/[0.06] bg-[#0c0e14] p-2.5">
                  <span className="text-slate-400">Bullpen Fatigue & Leverage Index</span>
                  <span className={selectedBatter.bullpenFatigue === 'MISSING' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    [{selectedBatter.bullpenFatigue === 'MISSING' ? 'FLAGGED_MISSING' : 'VERIFIED'}]
                  </span>
                </div>
                <div className="flex items-center justify-between border border-white/[0.06] bg-[#0c0e14] p-2.5">
                  <span className="text-slate-400">Home Plate Umpire Zone Bias</span>
                  <span className="text-cyan-400 font-bold">[{selectedBatter.umpireProfile.name}]</span>
                </div>
              </div>
            </div>

            {/* Deep Vector Analytics */}
            <div className="mt-6 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                2. DETERMINISTIC LAUNCH PROFILE
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="border border-white/[0.06] bg-[#0c0e14] p-3">
                  <div className="text-[9px] text-slate-400">ISO VS PITCH TYPE</div>
                  <div className="mt-1 text-base font-bold text-white">{selectedBatter.isoVsPitchType}</div>
                </div>
                <div className="border border-white/[0.06] bg-[#0c0e14] p-3">
                  <div className="text-[9px] text-slate-400">LAUNCH ANGLE MEDIAN</div>
                  <div className="mt-1 text-base font-bold text-white">{selectedBatter.launchAngleMedian}°</div>
                </div>
              </div>
            </div>

            {/* Cryptographic SHA-256 Lock Proof */}
            <div className="mt-6 space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                3. CRYPTOGRAPHIC AUDIT RECORD
              </div>
              <div className="border border-white/[0.08] bg-[#040507] p-3 text-[10px] space-y-1.5 text-slate-300 break-all">
                <div><span className="text-slate-400">HASH:</span> {selectedBatter.sha256Hash}</div>
                <div><span className="text-slate-400">LOCKED:</span> {selectedBatter.lockTimestamp}</div>
                <div><span className="text-slate-400">PROOF_MERKLE_ROOT:</span> 0x8f2d9c44b7a1e05d6812...</div>
                <div className="text-emerald-400 font-bold pt-1">[STATUS: MATHEMATICALLY_UNALTERABLE]</div>
              </div>
            </div>

            {/* Drawer Action */}
            <div className="mt-8 border-t border-white/[0.08] pt-4">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full border border-emerald-500 bg-emerald-500/10 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black uppercase"
              >
                [CLOSE_EVIDENCE_INSPECTION]
              </button>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};
