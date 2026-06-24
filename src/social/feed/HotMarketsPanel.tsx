import React from 'react';
import { Sparkles, Save, Check } from 'lucide-react';
import { HOT_MARKETS } from '../../data/mockData';
import { Vouch } from '../../types';

interface HotMarketsPanelProps {
  onQuickVouch: (vouch: Vouch) => void;
  savedVouchIds: string[];
}

export default function HotMarketsPanel({ onQuickVouch, savedVouchIds }: HotMarketsPanelProps) {
  return (
    <div className="bg-[#121824] rounded-xl border border-slate-850 p-4" id="hot-markets-card">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-sky-400" />
        <h3 className="font-bold text-slate-100 text-sm tracking-wide uppercase">Hot MLB Markets</h3>
      </div>

      <div className="space-y-3">
        {HOT_MARKETS.map((m) => {
          return (
            <div
              key={m.id}
              className="p-3 bg-[#0b0f19] rounded-lg border border-slate-800 space-y-2 text-xs"
              id={`hot-market-${m.id}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded uppercase">
                  {m.sport}
                </span>
                <span className="text-slate-400 text-[10px] font-mono">{m.startTime}</span>
              </div>
              <p className="font-medium text-slate-200 line-clamp-1">{m.game}</p>
              
              <div className="pt-1 border-t border-slate-800/60">
                <p className="text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">Headline Selection</p>
                <div className="grid grid-cols-2 gap-2">
                  {m.selections.map((sel) => {
                    // Create unique ID for this selection as a vouch target
                    const vouchId = `vouch-${m.id}-${sel.name.replace(/\s+/g, '-').toLowerCase()}`;
                    const isSaved = savedVouchIds.includes(vouchId);
                    
                    const handleVouchClick = () => {
                      const newVouch: Vouch = {
                        id: vouchId,
                        vouchSource: "VouchEdge Community",
                        userNote: "Quick vouch from live MLB board selection.",
                        market: m.headlineMarket,
                        sport: "MLB",
                        playerOrTeam: sel.name,
                        gameName: m.game,
                        odds: sel.odds,
                        status: "PENDING",
                        savedCount: sel.vouchCount,
                        vouchedCount: sel.vouchCount + 1,
                        createdAt: new Date().toISOString(),
                        isSavedByUser: true,
                        isVouchedByUser: true
                      };
                      onQuickVouch(newVouch);
                    };

                    return (
                      <button
                        key={sel.name}
                        onClick={handleVouchClick}
                        className={`p-2 rounded text-left border transition-all flex flex-col justify-between ${
                          isSaved
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                        id={`quick-vouch-sel-${m.id}-${sel.name.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <span className="font-bold block truncate">{sel.name}</span>
                        <div className="flex items-center justify-between gap-1 w-full mt-1">
                          <span className={`${isSaved ? 'text-emerald-300' : 'text-sky-400'} font-mono font-bold text-[10px]`}>
                            {sel.odds}
                          </span>
                          <span className="text-slate-400 text-[9px] font-mono">
                            {sel.vouchCount + (isSaved ? 1 : 0)} vouches
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
