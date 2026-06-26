import React from 'react';
import { Flame, Check, Plus } from 'lucide-react';
import { FeedPost, Vouch } from '../../types';

interface TrendingVouchesPanelProps {
  posts: FeedPost[];
  onSaveVouch: (vouch: Vouch) => void;
  savedVouchIds: string[];
}

export default function TrendingVouchesPanel({
  posts,
  onSaveVouch,
  savedVouchIds,
}: TrendingVouchesPanelProps) {
  // Derive vouches from posts list
  const activeVouches = posts
    .filter((p) => p.vouch)
    .map((p) => p.vouch!)
    .sort((a, b) => b.vouchedCount - a.vouchedCount);

  return (
    <div className="bg-[#121824] rounded-xl border border-slate-850 p-4" id="trending-vouches-card">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-slate-100 text-sm tracking-wide uppercase">Trending Vouches</h3>
      </div>

      {activeVouches.length === 0 ? (
        <div className="text-xs text-slate-400 py-4 text-center">
          Trending builds after posts are created.
        </div>
      ) : (
        <div className="space-y-3">
          {activeVouches.slice(0, 3).map((v) => {
            const isSaved = savedVouchIds.includes(v.id);
            return (
              <div
                key={v.id}
                className="p-3 bg-[#0b0f19] rounded-lg border border-slate-800 flex items-start justify-between gap-2 text-xs"
                id={`trending-item-${v.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] bg-sky-950 text-sky-400 font-bold px-1.5 py-0.5 rounded uppercase">
                      {v.sport}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      Odds: {v.odds}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-200 truncate">
                    {v.playerOrTeam || v.market}
                  </p>
                  <p className="text-slate-400 text-[10px] truncate">{v.gameName}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-slate-400 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{v.vouchedCount} active collective vouches</span>
                  </div>
                </div>

                <button
                  onClick={() => onSaveVouch(v)}
                  className={`p-1.5 rounded-md border flex items-center justify-center transition-all ${
                    isSaved
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                  title={isSaved ? 'Saved to Vouch Board' : 'Save to Vouch Board'}
                  id={`save-vouch-trending-btn-${v.id}`}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
