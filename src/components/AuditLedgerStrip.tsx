'use client';

import React from 'react';
import { Lock, Fingerprint, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { AUDIT_BLOCKS } from '@/data/mockData';

export const AuditLedgerStrip: React.FC = () => {
  return (
    <section id="audit" className="relative border-b border-white/[0.08] bg-[#06070a] py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/[0.08] pb-4 font-mono">
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-400">
              CRYPTOGRAPHIC PROOFS // ZERO RETROACTIVE EDITS
            </span>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-white font-sans sm:text-3xl">
              Immutable Slate Audit Ledger
            </h2>
          </div>
          <div className="mt-2 md:mt-0 text-xs text-slate-400">
            MERKLE_TREE_VALIDATOR // SHA-256 SECURED
          </div>
        </div>

        {/* Ledger Blocks List */}
        <div className="mt-6 space-y-3 font-mono text-xs">
          {AUDIT_BLOCKS.map((block) => (
            <div
              key={block.blockId}
              className="border border-white/[0.08] bg-[#080a0f] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-emerald-400"></span>
                  <span className="font-bold text-white">BLOCK #{block.blockId}</span>
                  <span className="text-white/[0.2]">//</span>
                  <span className="text-slate-400">{block.timestamp}</span>
                  <span className="border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                    {block.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 break-all">
                  MERKLE_ROOT: {block.merkleRoot}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] border-t lg:border-t-0 border-white/[0.06] pt-2 lg:pt-0">
                <div>
                  <span className="text-slate-400">BATTERS:</span>{' '}
                  <span className="text-white font-bold">{block.slateBattersAudited}</span>
                </div>
                <div>
                  <span className="text-slate-400">EDGES:</span>{' '}
                  <span className="text-emerald-400 font-bold">{block.edgesDetected}</span>
                </div>
                <div>
                  <span className="text-slate-400">COVERAGE:</span>{' '}
                  <span className="text-cyan-400 font-bold">{block.coverageRatio}</span>
                </div>
                <div className="text-[9px] text-slate-400 bg-black/40 border border-white/[0.06] px-2 py-1">
                  SIG: {block.signature}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cryptographic Guarantee Banner */}
        <div className="mt-6 border border-emerald-500/20 bg-emerald-500/5 p-3.5 font-mono text-xs text-slate-300 flex items-center gap-3">
          <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-emerald-400">Zero Retroactive Edit Guarantee:</strong> Slate predictions are mathematically tied to pre-game timestamps. Any retrospective alteration invalidates the Merkle proof.
          </span>
        </div>

      </div>
    </section>
  );
};
