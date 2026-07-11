import React from 'react';
import { Layers3, Lock, Save } from 'lucide-react';
import ParlayIdentityBadge from '../../trust/ParlayIdentityBadge';
import type { ClientIdentityAssessment } from '../../../lib/parlayIdentity';

export type ParlayHubMobileSlipDockProps = {
  legCount: number;
  totalOdds: string;
  identity: ClientIdentityAssessment;
  canSave: boolean;
  canLock: boolean;
  isSaving: boolean;
  isSharing: boolean;
  onOpenSlip: () => void;
  onSave: () => void;
  onLock: () => void;
};

/** Sticky mobile slip bar — opens full ParlayOS sheet for leg editing. */
export default function ParlayHubMobileSlipDock({
  legCount,
  totalOdds,
  identity,
  canSave,
  canLock,
  isSaving,
  isSharing,
  onOpenSlip,
  onSave,
  onLock,
}: ParlayHubMobileSlipDockProps) {
  if (legCount === 0) return null;

  return (
    <div
      className="xl:hidden fixed inset-x-0 bottom-[4.5rem] z-[85] px-3 pb-safe"
      role="region"
      aria-label="Parlay slip actions"
    >
      <div className="rounded-2xl border border-cyan-400/30 bg-[var(--bg-obsidian)]/98 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
        <button
          type="button"
          onClick={onOpenSlip}
          className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-white/10 min-h-[3rem]"
        >
          <div className="relative shrink-0">
            <Layers3 className="w-5 h-5 text-cyan-300" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-cyan-400 text-[9px] font-black text-black flex items-center justify-center px-0.5">
              {legCount}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white">ParlayOS Slip</p>
            <p className="text-[10px] font-mono text-cyan-200/80">
              {totalOdds} combined · tap to edit legs
            </p>
          </div>
          <ParlayIdentityBadge identity={identity} />
        </button>

        <div className="grid grid-cols-2 gap-2 p-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || isSaving || isSharing}
            className="min-h-[2.75rem] flex items-center justify-center gap-1.5 rounded-xl border border-white/15 text-[10px] font-bold uppercase tracking-wide text-white/75 hover:border-white/30 disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onLock}
            disabled={!canLock || isSaving || isSharing}
            className="min-h-[2.75rem] flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-[10px] font-bold uppercase tracking-wide text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-40"
          >
            <Lock className="w-3.5 h-3.5" />
            {isSharing ? 'Locking…' : 'Lock'}
          </button>
        </div>
      </div>
    </div>
  );
}
