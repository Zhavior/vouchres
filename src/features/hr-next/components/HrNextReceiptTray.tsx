import { FileCheck2, X, ShieldCheck } from 'lucide-react';

interface HrNextReceiptTrayProps {
  playerName: string;
  receipt: {
    updated: string;
    sources: string[];
    missing: string;
    methodology: string;
  };
  onClose: () => void;
}

export function HrNextReceiptTray({ playerName, receipt, onClose }: HrNextReceiptTrayProps) {
  return (
    <div className="border-2 border-white/15 bg-black p-4 font-mono shadow-2xl space-y-3" role="region" aria-label={`${playerName} research receipt`}>
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <FileCheck2 className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
          <div className="min-w-0">
            <strong className="text-xs font-black text-white uppercase block">
              RESEARCH AUDIT RECEIPT · {playerName}
            </strong>
            <span className="text-[10px] text-zinc-500 uppercase block">
              UPDATED: {receipt.updated} · DETERMINISTIC CONCLUSION PRESERVED
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close receipt"
          className="p-1 border border-white/20 text-zinc-400 hover:text-white hover:border-white transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 pt-1">
        <div className="border border-white/10 bg-zinc-950 p-2.5">
          <span className="text-[8.5px] font-black uppercase tracking-widest text-zinc-500 block mb-1">DATA SOURCES</span>
          <p className="text-[10px] text-zinc-300 font-medium">{receipt.sources.join(' · ')}</p>
        </div>
        <div className="border border-white/10 bg-zinc-950 p-2.5">
          <span className="text-[8.5px] font-black uppercase tracking-widest text-zinc-500 block mb-1">MISSING INPUTS</span>
          <p className="text-[10px] text-zinc-400 font-medium">{receipt.missing}</p>
        </div>
        <div className="border border-white/10 bg-zinc-950 p-2.5">
          <span className="text-[8.5px] font-black uppercase tracking-widest text-zinc-500 block mb-1">METHODOLOGY</span>
          <p className="text-[10px] text-zinc-300 font-medium">{receipt.methodology}</p>
        </div>
      </div>
    </div>
  );
}

