import { FileCheck2, X } from 'lucide-react';
import { AuroraMaxEyebrow } from '../../../components/aurora-max/AuroraMaxPrimitives';

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
    <div className="hr-max-receipt" role="region" aria-label={`${playerName} research receipt`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--aurora-max-emerald)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-[#e7e9e2]">Research receipt · {playerName}</p>
            <p className="mt-1 text-[10px] text-white/35">{receipt.updated} · original conclusion preserved</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close receipt" className="text-white/35 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <AuroraMaxEyebrow>Sources</AuroraMaxEyebrow>
          <p className="mt-1 text-[10px] text-white/50">{receipt.sources.join(' · ')}</p>
        </div>
        <div>
          <AuroraMaxEyebrow>Missing inputs</AuroraMaxEyebrow>
          <p className="mt-1 text-[10px] text-white/50">{receipt.missing}</p>
        </div>
        <div>
          <AuroraMaxEyebrow>Method</AuroraMaxEyebrow>
          <p className="mt-1 text-[10px] text-white/50">{receipt.methodology}</p>
        </div>
      </div>
    </div>
  );
}
