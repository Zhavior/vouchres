import React from 'react';
import { ChunkA, ChunkC } from '../api/contracts';
import { AuroraMaxControl } from '../../../components/aurora-max/AuroraMaxPrimitives';
import { DeepResearchPanel } from './DeepResearchPanel';

interface DeepResearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: ChunkA;
  chunkC: ChunkC | null;
  isLoading: boolean;
}

export function DeepResearchDrawer({
  isOpen,
  onClose,
  data,
  chunkC,
  isLoading
}: DeepResearchDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-[#0d121f] border-l border-white/10 p-6 flex flex-col h-full overflow-y-auto shadow-2xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-vouch-cyan uppercase">
              DEEP RESEARCH TELEMETRY
            </span>
            <h2 className="text-lg font-black text-white">{data.identity?.name || 'Player'}</h2>
            <p className="text-xs text-white/60">
              {data.identity?.teamAbbreviation || 'MLB'} vs {data.opponentTeamId || 'OPP'} · Grade {(data.score?.hrIndex ?? 0)} HRPI
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <DeepResearchPanel data={data} chunkC={chunkC} isLoading={isLoading} />

        {/* Footer Action */}
        <div className="mt-8 border-t border-white/10 pt-4 flex justify-end">
          <AuroraMaxControl tone="neutral" onClick={onClose}>
            Close Research
          </AuroraMaxControl>
        </div>
      </div>
    </div>
  );
}
