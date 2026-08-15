import { FileCheck2, X } from 'lucide-react';
import { AuroraMaxEyebrow } from '../../../components/aurora-max/AuroraMaxPrimitives';
import type { HrMaxDeskRow } from '../mapHrWatchToDesk';

export function HrMaxReceiptTray({ row, onClose }: { row: HrMaxDeskRow; onClose: () => void }) {
  return (
    <div className="hr-max-receipt" role="region" aria-label={`${row.playerName} research receipt`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--aurora-max-emerald)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-[#e7e9e2]">Research receipt · {row.playerName}</p>
            <p className="mt-1 text-[10px] text-white/35">{row.receipt.updated} · original conclusion preserved</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close receipt" className="text-white/35 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="hr-max-receipt__grid">
        <div>
          <AuroraMaxEyebrow>Sources</AuroraMaxEyebrow>
          <p>{row.receipt.sources.join(' · ')}</p>
        </div>
        <div>
          <AuroraMaxEyebrow>Missing inputs</AuroraMaxEyebrow>
          <p>{row.receipt.missing}</p>
        </div>
        <div>
          <AuroraMaxEyebrow>Method</AuroraMaxEyebrow>
          <p>{row.receipt.methodology}</p>
        </div>
      </div>
    </div>
  );
}
