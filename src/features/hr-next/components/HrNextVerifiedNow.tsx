import React from 'react';
import { CheckCircle2, DatabaseZap, LockKeyhole, Plus, Search } from 'lucide-react';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import {
  VERIFIED_NOW_LABELS,
  type VerifiedNowSlate,
  type VerifiedNowRequirement,
} from '../utils/verifiedNow';

export const HrNextVerifiedNow = React.memo(function HrNextVerifiedNow({
  slate,
  onOpenResearch,
  onAddToSlip,
}: {
  slate: VerifiedNowSlate;
  onOpenResearch: (player: { id: string | number; name: string }) => void;
  onAddToSlip: (row: HrWatchRow) => void;
}) {
  const missing = (Object.entries(slate.missingCounts) as Array<[VerifiedNowRequirement, number]>)
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);

  return (
    <section
      data-testid="hr-next-verified-now"
      aria-label="Verified Now source-complete candidates"
      className="border-2 border-ve-emerald/45 bg-ve-emerald/15 font-mono"
    >
      <div className="flex flex-col gap-3 border-b border-ve-emerald/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center border border-ve-emerald/40 bg-ve-emerald/60 text-ve-emerald">
            {slate.completeRows > 0 ? <CheckCircle2 className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ve-emerald">Verified Now</h2>
            <p className="mt-1 text-[10px] text-white/55">Source-complete research candidates · never an outcome guarantee</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-widest">
          <span className="border border-ve-emerald/35 bg-black px-2.5 py-1 text-ve-emerald">{slate.completeRows} verified</span>
          <span className="border border-white/15 bg-black px-2.5 py-1 text-white/55">{slate.totalRows} reviewed</span>
        </div>
      </div>

      {slate.candidates.length === 0 ? (
        <div className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase text-white">
              <DatabaseZap className="h-4 w-4 text-ve-amber" /> No source-complete candidates yet
            </div>
            <p className="mt-1.5 max-w-3xl text-[11px] leading-relaxed text-white/55">
              HRPI rows remain available for research, but promotion and quick-add stay locked until every required feed is present.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 lg:max-w-[430px] lg:justify-end">
            {missing.map(([requirement, count]) => (
              <span key={requirement} className="border border-ve-amber/25 bg-ve-amber/10/20 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-ve-amber">
                {VERIFIED_NOW_LABELS[requirement]} missing · {count}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-2 p-3 xl:grid-cols-5">
          {slate.candidates.map(({ row }, index) => (
            <article key={row.stableId} className="border border-white/15 bg-black p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-ve-emerald">#{index + 1} verified</span>
                <strong className="text-xl font-bold tabular-nums text-ve-emerald">{Math.round(row.hrScore)}</strong>
              </div>
              <h3 className="mt-2 truncate text-xs font-semibold uppercase text-white">{row.playerName}</h3>
              <p className="mt-1 truncate text-[10px] text-white/55">{row.team} vs {row.opponent} · {row.oddsLabel}</p>
              <div className="mt-3 flex gap-1.5">
                <button type="button" onClick={() => onOpenResearch({ id: row.playerId ?? row.stableId, name: row.playerName })} className="inline-flex h-7 flex-1 items-center justify-center gap-1 border border-white/20 bg-obsidian-950 text-[9px] font-semibold uppercase text-white/70 hover:border-white hover:text-white">
                  <Search className="h-3 w-3" /> Dossier
                </button>
                <button type="button" onClick={() => onAddToSlip(row)} className="inline-flex h-7 flex-1 items-center justify-center gap-1 border border-ve-emerald bg-ve-emerald text-[9px] font-semibold uppercase text-black hover:bg-ve-emerald">
                  <Plus className="h-3 w-3" /> Slip
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
});
