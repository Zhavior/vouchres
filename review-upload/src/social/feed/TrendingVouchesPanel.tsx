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
    <div className="glass-panel glass-border font-z8 rounded-2xl p-4" id="trending-vouches-card">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-vouch-emerald" />
        <h3 className="terminal-text text-white/70">Trending Vouches</h3>
      </div>

      {activeVouches.length === 0 ? (
        <div className="text-xs text-white/30 py-4 text-center">
          Trending builds after posts are created.
        </div>
      ) : (
        <div className="space-y-3">
          {activeVouches.slice(0, 3).map((v) => {
            const isSaved = savedVouchIds.includes(v.id);
            return (
              <div
                key={v.id}
                className="p-3 bg-white/[0.02] rounded-lg border border-white/10 flex items-start justify-between gap-2 text-xs"
                id={`trending-item-${v.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="terminal-text bg-vouch-cyan/10 text-vouch-cyan px-1.5 py-0.5 rounded">
                      {v.sport}
                    </span>
                    <span className="text-white/30 text-[10px]">
                      Odds: {v.odds}
                    </span>
                  </div>
                  <p className="font-semibold text-white truncate">
                    {v.playerOrTeam || v.market}
                  </p>
                  <p className="text-white/40 text-[10px] truncate">{v.gameName}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-white/40 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-vouch-emerald"></span>
                    <span>{v.vouchedCount} active collective vouches</span>
                  </div>
                </div>

                <button
                  onClick={() => onSaveVouch(v)}
                  className={[
                    'p-1.5 rounded-md flex items-center justify-center transition-all',
                    isSaved ? 'bg-vouch-emerald/10 text-vouch-emerald' : 'bg-white/[0.03] text-white/40 hover:text-white',
                  ].join(' ')}
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
