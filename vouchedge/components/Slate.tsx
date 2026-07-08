"use client";
import React from 'react';

const matchups = [
  { id: 1, away: 'NYY', home: 'LAD', awayOdds: '-122', homeOdds: '+110', time: 'LIVE', status: 'active' },
  { id: 2, away: 'PHI', home: 'ATL', awayOdds: '+105', homeOdds: '-125', time: '19:05', status: 'upcoming' },
  { id: 3, away: 'HOU', home: 'TEX', awayOdds: '-140', homeOdds: '+120', time: '20:10', status: 'upcoming' },
  { id: 4, away: 'CHC', home: 'MIL', awayOdds: '+130', homeOdds: '-150', time: '20:10', status: 'upcoming' },
  { id: 5, away: 'BOS', home: 'BAL', awayOdds: '+115', homeOdds: '-135', time: '21:30', status: 'upcoming' },
];

export const DailySlate = ({ onSelect, selectedId }: { onSelect: (id: number) => void, selectedId: number }) => (
  <div className="font-mono text-[10px] border border-white/5 bg-obsidian overflow-hidden">
    <div className="grid grid-cols-4 p-2 border-b border-white/10 bg-white/5 text-white/40 uppercase tracking-widest">
      <span className="col-span-2">Matchup</span>
      <span>Odds</span>
      <span className="text-right">Time</span>
    </div>
    <div className="divide-y divide-white/5 max-h-[200px] overflow-y-auto no-scrollbar">
      {matchups.map((m) => (
        <div 
          key={m.id} 
          onClick={() => onSelect(m.id)}
          className={`grid grid-cols-4 p-3 items-center cursor-pointer transition-colors ${
            selectedId === m.id ? 'bg-emerald-400/10 border-l-2 border-emerald-400' : 'hover:bg-white/[0.02]'
          }`}
        >
          <div className="col-span-2 flex items-center gap-2">
            <span className="text-white font-bold">{m.away}</span>
            <span className="text-white/20">@</span>
            <span className="text-white font-bold">{m.home}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white/60">{m.awayOdds}</span>
            <span className="text-white/60">{m.homeOdds}</span>
          </div>
          <div className="text-right">
            <span className={m.time === 'LIVE' ? 'text-emerald-400 animate-pulse' : 'text-white/40'}>
              {m.time}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
