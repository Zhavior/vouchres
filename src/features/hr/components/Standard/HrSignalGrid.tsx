import React, { useMemo, useState } from 'react';
import { ChevronDown, Plus, Search, ShieldCheck, ShieldQuestion } from 'lucide-react';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import type { HrWatchRow } from '../../types/hrWatch';
import { boardScore, oddsDisplay } from '../../engine/signalScore';
import { logoByTeamName } from '../../../../lib/teamLogos';

const PAGE_SIZE = 12;

interface HrSignalGridProps {
  rows: readonly HrWatchRow[];
  onResearch: (player: HrWatchRow) => void;
  onAddToSlip?: (player: HrWatchRow) => void;
}

function scoreTone(score: number): string {
  if (score >= 80) return 'text-amber-300';
  if (score >= 65) return 'text-vouch-cyan';
  if (score >= 50) return 'text-vouch-emerald';
  return 'text-white/70';
}

/**
 * The single stat a Standard-mode card leads with for the opposing pitcher.
 * Vulnerability is the layer that decides whether a matchup is exploitable, so
 * it beats a raw HR/9 line that a casual reader has to translate first.
 */
function pitcherVulnerabilityLabel(row: HrWatchRow): string | null {
  if (row.pitcherVulnerability == null || !Number.isFinite(row.pitcherVulnerability)) return null;
  return `${Math.round(row.pitcherVulnerability)} vuln`;
}

const SimpleSignalCard = React.memo(function SimpleSignalCard({
  row,
  score,
  onResearch,
  onAddToSlip,
}: {
  row: HrWatchRow;
  score: number;
  onResearch: (player: HrWatchRow) => void;
  onAddToSlip?: (player: HrWatchRow) => void;
}) {
  const teamLogo = row.teamLogoUrl || logoByTeamName(row.team);
  const price = oddsDisplay(row);
  const vulnerability = pitcherVulnerabilityLabel(row);
  const isOfficial = row.truthStatus === 'official';
  const pitcher = row.pitcherName && row.pitcherName !== 'Pitcher TBD' ? row.pitcherName : null;

  return (
    <article className="flex min-w-0 flex-col gap-2.5 rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur-xl transition hover:border-white/20 hover:bg-black/50">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={() => onResearch(row)}
          className="flex h-12 w-12 shrink-0 items-end justify-center overflow-hidden rounded-xl border border-white/12 bg-black/50"
          aria-label={`Open research for ${row.playerName}`}
        >
          <PlayerHeadshot name={row.playerName} playerId={row.playerId} headshotUrl={row.headshotUrl} size={48} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-black tracking-tight text-white">{row.playerName}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-white/50">
            {teamLogo ? <img src={teamLogo} alt="" className="h-3 w-3 shrink-0 object-contain" loading="lazy" /> : null}
            <span className="truncate">{row.team} vs {row.opponent}</span>
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className={`font-mono text-2xl font-black leading-none tabular-nums ${scoreTone(score)}`}>{score}</p>
          <p className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-white/35">Signal</p>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-black/30 px-2.5 py-1.5">
        <span className="shrink-0 font-mono text-[8px] font-bold uppercase tracking-wider text-white/35">vs</span>
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-white/75">{pitcher ?? 'Pitcher TBD'}</span>
        {vulnerability ? (
          <span className="shrink-0 rounded-md border border-vouch-cyan/25 bg-vouch-cyan/10 px-1.5 py-0.5 font-mono text-[9px] font-black tabular-nums text-vouch-cyan">
            {vulnerability}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${
            isOfficial
              ? 'border-vouch-emerald/30 bg-vouch-emerald/10 text-vouch-emerald'
              : 'border-amber-400/25 bg-amber-400/8 text-amber-200/85'
          }`}
        >
          {isOfficial ? <ShieldCheck className="h-2.5 w-2.5" /> : <ShieldQuestion className="h-2.5 w-2.5" />}
          {isOfficial ? 'Confirmed' : 'Preview'}
        </span>
        {price ? (
          <span className="inline-flex shrink-0 items-center rounded-md border border-white/10 bg-black/35 px-1.5 py-0.5 font-mono text-[9px] font-bold tabular-nums text-white/60">
            {price}
          </span>
        ) : null}
      </div>

      <div className="mt-auto grid grid-cols-[1fr_auto] gap-1.5">
        {onAddToSlip ? (
          <button
            type="button"
            onClick={() => onAddToSlip(row)}
            disabled={row.truthStatus === 'blocked'}
            className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-vouch-emerald/40 bg-vouch-emerald/12 px-2 font-mono text-[10px] font-black uppercase tracking-wider text-vouch-emerald transition hover:bg-vouch-emerald/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add to slip
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => onResearch(row)}
          aria-label={`Research ${row.playerName}`}
          className="flex min-h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-black/30 text-white/55 transition hover:border-vouch-cyan/40 hover:text-vouch-cyan"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
});

/**
 * Standard-mode board: signal score, matchup, one action. No tier columns, no
 * raw matrices, no nested filter layers — the depth lives behind Pro Mode.
 */
export function HrSignalGrid({ rows, onResearch, onAddToSlip }: HrSignalGridProps) {
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Score once per row, then sort — the comparator never recomputes. Ranking on
  // the same number the card shows keeps the order and the score in agreement.
  const ranked = useMemo(
    () =>
      rows
        .map((row) => ({ row, score: boardScore(row) }))
        .sort((a, b) => b.score - a.score),
    [rows],
  );

  const visible = ranked.slice(0, limit);
  const remaining = ranked.length - visible.length;

  return (
    <section aria-label="Home run signals" className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-white/70">HR signal board</h2>
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/35">
          {ranked.length} player{ranked.length === 1 ? '' : 's'} · ranked by signal
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visible.map(({ row, score }) => (
          <SimpleSignalCard key={row.stableId} row={row} score={score} onResearch={onResearch} onAddToSlip={onAddToSlip} />
        ))}
      </div>

      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setLimit((value) => value + PAGE_SIZE)}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-black/25 font-mono text-[10px] font-black uppercase tracking-wider text-white/55 transition hover:border-vouch-cyan/35 hover:text-vouch-cyan"
        >
          Show {Math.min(PAGE_SIZE, remaining)} more <ChevronDown className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </section>
  );
}

export default HrSignalGrid;
