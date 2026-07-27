import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import PlayerHeadshot from '../../components/parlays/PlayerHeadshot';
import { hrBoardQueryOptions, todayISO } from '../../hooks/queries/hrBoardQuery';
import { buildBoard } from '../../features/hr/utils/normalizeHrWatch';
import type { HrWatchRow } from '../../features/hr/types/hrWatch';

/**
 * Aurora HR Board Preview
 * Live preview of today's HR Board — the real product, never mock data.
 * Reads the same canonical query the HR Board page uses; the guest warm
 * cache (warmGuestHrBoardCache) usually seeds it before this renders.
 */
interface HrBoardPreviewProps {
  onNavigate: (section: string) => void;
}

const PREVIEW_COUNT = 3;

export function HrBoardPreview({ onNavigate }: HrBoardPreviewProps) {
  const { data, isPending } = useQuery(hrBoardQueryOptions(todayISO()));

  const board = data ? buildBoard(data) : null;
  // Confirmed lineups first — fall back to the curated projection preview.
  const rows = board
    ? (board.confirmed.length > 0 ? board.confirmed : board.curated).slice(0, PREVIEW_COUNT)
    : [];
  const isConfirmed = (board?.confirmed.length ?? 0) > 0;

  return (
    <section className="relative bg-[var(--color-ve-obsidian)] px-4 py-20">
      <div className="aurora-container max-w-5xl">
        {/* Section header */}
        <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--color-ve-ion)]">
              Live from the HR Board
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Today&apos;s top signals
            </h2>
          </div>
          {rows.length > 0 && (
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
              {isConfirmed ? 'Confirmed lineups' : 'Projection preview'}
            </p>
          )}
        </div>

        {/* Board rows */}
        {isPending && !board ? (
          <SkeletonGrid />
        ) : rows.length > 0 ? (
          <div className="aurora-stagger grid gap-4 sm:grid-cols-3">
            {rows.map((row, index) => (
              <PlayerCard key={row.stableId} row={row} index={index} />
            ))}
          </div>
        ) : (
          <EmptyBoard />
        )}

        {/* CTA */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => onNavigate('hr_board')}
            className="aurora-surface-1 aurora-button-press aurora-focus aurora-touch-target font-ui inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--color-ve-storm)]"
          >
            View the full board
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function PlayerCard({ row, index }: { row: HrWatchRow; index: number }) {
  return (
    <article
      className="aurora-slide-up aurora-surface-2 rounded-xl border border-white/5 p-5 transition-colors hover:border-[var(--color-ve-charged)]"
      aria-labelledby={`hr-preview-player-${row.stableId}`}
    >
      {/* Rank + risk tier */}
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-xs text-white/40">#{row.rank ?? index + 1}</span>
        <span className={`font-ui rounded px-2 py-1 text-xs font-semibold ${riskTierClass(row.riskTier)}`}>
          {row.riskTier}
        </span>
      </div>

      {/* Player identity */}
      <div className="mb-4 flex items-center gap-3">
        <PlayerHeadshot
          name={row.playerName}
          playerId={row.playerId}
          headshotUrl={row.headshotUrl}
          size={48}
          priority={index < 2}
        />
        <div className="min-w-0">
          <h3
            id={`hr-preview-player-${row.stableId}`}
            className="font-display truncate text-lg font-semibold text-white"
          >
            {row.playerName}
          </h3>
          <p className="font-ui truncate text-sm text-white/50">
            {row.team}
            {row.opponent ? ` vs ${row.opponent}` : ''}
          </p>
        </div>
      </div>

      {/* Real board metrics */}
      <dl className="space-y-3">
        <MetricRow label="HR score" value={formatScore(row.hrScore)} accent="text-[var(--color-ve-ion)]" />
        {row.vouchScore != null && (
          <MetricRow label="Vouch score" value={formatScore(row.vouchScore)} accent="text-[var(--color-ve-voltage)]" />
        )}
        <div className="flex items-center justify-between border-t border-white/5 pt-2">
          <dt className="font-ui text-xs text-white/40">Odds</dt>
          <dd className="font-mono text-xs font-semibold text-white/70">{row.oddsLabel || '—'}</dd>
        </div>
      </dl>
    </article>
  );
}

function MetricRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="font-ui text-xs text-white/50">{label}</dt>
      <dd className={`font-mono text-sm font-semibold ${accent}`}>{value}</dd>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-3" aria-hidden="true">
      {Array.from({ length: PREVIEW_COUNT }, (_, i) => (
        <div key={i} className="aurora-surface-2 h-64 animate-pulse rounded-xl border border-white/5" />
      ))}
    </div>
  );
}

function EmptyBoard() {
  return (
    <div className="aurora-surface-2 rounded-xl border border-white/5 p-10 text-center">
      <p className="font-display text-lg font-semibold text-white">
        The board opens with today&apos;s lineups.
      </p>
      <p className="font-ui mt-2 text-sm text-white/50">
        Signals publish once official lineup data arrives.
      </p>
    </div>
  );
}

function formatScore(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value)) : '—';
}

function riskTierClass(tier: HrWatchRow['riskTier']): string {
  switch (tier) {
    case 'Elite':
      return 'bg-[var(--aurora-gold)]/15 text-[var(--aurora-gold)]';
    case 'Core':
      return 'bg-[var(--color-ve-voltage)]/15 text-[var(--color-ve-voltage)]';
    case 'Watch':
      return 'bg-[var(--color-ve-ion)]/15 text-[var(--color-ve-ion)]';
    default:
      return 'bg-white/10 text-white/70';
  }
}
