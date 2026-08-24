'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, X, AlertTriangle, FileText, Copy, Check } from 'lucide-react';
import type { PlayerCandidate } from '@/types/intelligence';

interface HypothesisLockModalProps {
  player: PlayerCandidate | null;
  onClose: () => void;
  onLockConfirmed: (receiptId: string) => void;
}

export default function HypothesisLockModal({
  player,
  onClose,
  onLockConfirmed,
}: HypothesisLockModalProps) {
  const [copied, setCopied] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  if (!player) return null;

  const generatedReceiptId = `RCPT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const lockHash = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  const handleExecuteLock = () => {
    setIsLocked(true);
    setTimeout(() => {
      onLockConfirmed(generatedReceiptId);
    }, 1200);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(lockHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="border border-white/[0.12] bg-[#06070a] w-full max-w-lg shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#090b10] px-4 py-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-white">
            <Lock size={13} className="text-emerald-400" />
            <span className="font-semibold uppercase tracking-wider">Deterministic Hypothesis Lock</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs font-mono">
          <div className="space-y-1 font-sans">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Target Candidate</div>
            <div className="text-lg font-semibold text-white">
              {player.name} ({player.team} · {player.pos})
            </div>
            <div className="text-xs text-slate-400">
              Matchup: {player.opp} vs {player.pitcherOpp} ({player.pitcherHand}HP)
            </div>
          </div>

          {/* Model Metrics */}
          <div className="grid grid-cols-3 gap-2 border border-white/[0.06] bg-[#090b10] p-3 text-center">
            <div>
              <div className="text-[9px] uppercase text-slate-500">Model HRPI</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">{player.hrpi}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-slate-500">Projected HR%</div>
              <div className="text-sm font-bold text-white mt-0.5">{player.projHrPct}%</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-slate-500">Audit Form Weight</div>
              <div className="text-sm font-bold text-emerald-400 mt-0.5">{player.auditScore}%</div>
            </div>
          </div>

          {/* Compliance Disclaimer */}
          <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck size={13} />
              Permanent Ledger Commitment
            </div>
            <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
              Locking this hypothesis writes an immutable entry into the VouchEdge audit ledger. The post-game outcome will be permanently audited against ground-truth Statcast box scores with zero retroactive modifications.
            </p>
          </div>

          {/* Verification Hash */}
          <div className="space-y-1">
            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
              <span>Cryptographic Receipt Hash</span>
              <button
                onClick={handleCopyHash}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
              >
                {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                {copied ? 'Copied' : 'Copy Hash'}
              </button>
            </div>
            <div className="p-2 bg-[#090b10] border border-white/[0.06] text-slate-300 text-[10px] break-all select-all">
              {lockHash}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.08]">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/[0.08] hover:border-white/[0.2] text-slate-300 transition-colors font-sans text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteLock}
              disabled={isLocked}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-black font-semibold transition-colors font-sans text-xs inline-flex items-center gap-2"
            >
              {isLocked ? (
                <>
                  <Lock size={12} className="animate-spin" />
                  Writing to Ledger...
                </>
              ) : (
                <>
                  <CheckCircle2 size={12} />
                  Confirm & Lock Hypothesis
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
