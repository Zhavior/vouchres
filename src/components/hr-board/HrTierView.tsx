import React from 'react';
import { Flame, Plus, ChevronRight } from 'lucide-react';
import type { HrBoardGame, HrBoardRow } from '../../types/hrBoard';
import type { MLBPlayer } from '../../types';
import { Card, RiskBadge, ScorePill } from '../ui/primitives';
import { parseAmericanOdds } from '../../lib/odds';

interface Props {
  games: HrBoardGame[];
  onSelect: (row: HrBoardRow) => void;
  onAddLeg?: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string; gamePk?: string | number; playerId?: number | string }) => void;
}

const TIERS: { key: string; title: string; sub: string; color: string; match: (r: HrBoardRow) => boolean }[] = [
  { key: 't1', title: 'Tier 1 — Best HR Targets', sub: 'Elite/strong modeled spots', color: 'hsl(var(--ve-accent-gold))', match: (r) => r.grade === 'A+' || r.grade === 'A' },
  { key: 't2', title: 'Tier 2 — Strong But Riskier', sub: 'Playable with more variance', color: 'hsl(var(--ve-accent-cyan))', match: (r) => r.grade === 'B' },
  { key: 'sneaky', title: 'Sneaky HRs', sub: 'Lower-obvious, higher risk', color: 'hsl(var(--ve-accent-pink))', match: (r) => r.grade === 'C' },
  { key: 'avoid', title: 'Avoid / Trap Picks', sub: 'Weak modeled HR equity', color: '#f87171', match: (r) => r.grade === 'D' || r.grade === 'F' },
];


const FORM_COLOR: Record<string, string> = { Hot: 'hsl(var(--ve-accent-gold))', Average: 'hsl(var(--ve-text-muted))', Cold: 'hsl(var(--ve-accent-cyan))', Slump: 'hsl(var(--ve-text-muted))' };

function LineupBadge({ lineupStatus }: { lineupStatus?: string }) {
  const projected = lineupStatus === 'projected_unconfirmed';
  const confirmed = lineupStatus === 'confirmed';
  const label = confirmed ? 'Confirmed' : projected ? 'Preview' : 'Projected';
  const color = confirmed
    ? 'hsl(var(--ve-text-success))'
    : projected
      ? 'hsl(var(--ve-accent-gold))'
      : 'hsl(var(--ve-text-muted))';

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
      style={{ color, background: `${color}18`, border: `1px solid ${color}44` }}
    >
      {label}
    </span>
  );
}

function BreakdownChip({ label, value, color }: { label: string; value?: number; color: string }) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-mono font-bold"
      style={{ color, background: `${color}14`, border: `1px solid ${color}30` }}
    >
      {label} {Math.round(Number(value))}
    </span>
  );
}

function RecentStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--ve-border)/0.22)] bg-[hsl(var(--ve-surface-raised)/0.34)] px-2 py-1.5 text-center">
      <div className="text-[8px] font-mono uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">{label}</div>
      <div className="text-xs font-mono font-black text-[hsl(var(--ve-text-primary))]">{value}</div>
    </div>
  );
}

const HrCard: React.FC<{ row: HrBoardRow; onSelect: () => void; onAddLeg?: Props['onAddLeg'] }> = ({ row, onSelect, onAddLeg }) => {
  const recentForm = row.recentForm;
  const breakdown = row.scoreBreakdown;
  const topReasons = row.reasons?.slice(0, 4) ?? [];
  const projectedWarning = row.lineupStatus === 'projected_unconfirmed';

  return (
    <Card onClick={onSelect} className="group relative overflow-hidden border-[hsl(var(--ve-border)/0.30)] bg-[hsl(var(--ve-surface)/0.78)] p-0 shadow-lg shadow-[hsl(var(--ve-shadow)/0.12)] transition hover:-translate-y-0.5 hover:border-[hsl(var(--ve-accent-cyan)/0.34)]">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-[hsl(var(--ve-accent-cyan)/0.58)]" />
      <div className="p-3.5">
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={row.headshot} alt={row.playerName} loading="lazy" referrerPolicy="no-referrer" className="h-11 w-11 flex-shrink-0 rounded-xl border border-[hsl(var(--ve-border)/0.32)] bg-[hsl(var(--ve-surface-raised)/0.54)] object-cover" />
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-sm font-black text-[hsl(var(--ve-text-primary))]">
                <span className="font-mono text-[10px] text-[hsl(var(--ve-text-muted))]">#{row.rank ?? '-'}</span>
                <span className="truncate">{row.playerName}</span>
                {row.hrEdge >= 75 && <Flame className="w-3 h-3 text-[hsl(var(--ve-accent-gold))]" />}
              </p>
              <p className="truncate text-[11px] text-[hsl(var(--ve-text-muted))]">{row.team} vs {row.opponent}</p>
              <p className="truncate text-[10px] text-[hsl(var(--ve-text-secondary))]">{row.opponentPitcherName ?? row.opposingPitcher}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <LineupBadge lineupStatus={row.lineupStatus} />
            <RiskBadge risk={row.riskLabel} />
          </div>
        </div>

        <div className="mb-2.5 grid grid-cols-3 gap-1.5">
          <ScorePill label="HR Score" value={row.hrEdge} color="hsl(var(--ve-accent-gold))" />
          <ScorePill label="P.Vuln" value={row.pitcherVulnerability} color="hsl(var(--ve-accent-cyan))" />
          <ScorePill label="Vouch" value={row.vouchScore} color="hsl(var(--ve-accent-pink))" />
        </div>

        <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[10px] text-[hsl(var(--ve-text-muted))]">
          <span className="font-mono">{row.venue ?? 'Unknown venue'}</span>
          <span className="inline-flex items-center gap-1" style={{ color: FORM_COLOR[row.formTag] ?? '#94a3b8' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: FORM_COLOR[row.formTag] ?? '#94a3b8' }} />{row.formTag}
          </span>
        </div>

        {projectedWarning && (
          <div className="mb-2 rounded-lg border border-[hsl(var(--ve-accent-gold)/0.22)] bg-[hsl(var(--ve-accent-gold)/0.08)] px-2.5 py-2 text-[11px] text-[hsl(var(--ve-accent-gold))]">
            Official lineup not posted yet.
          </div>
        )}

        {topReasons.length > 0 && (
          <div className="mb-2.5 rounded-xl border border-[hsl(var(--ve-border)/0.26)] bg-[hsl(var(--ve-surface-raised)/0.26)] px-3 py-2">
            <div className="mb-1 text-[10px] font-mono font-bold uppercase tracking-wide text-[hsl(var(--ve-text-muted))]">Why this pick?</div>
            <div className="space-y-1">
              {topReasons.map((reason, index) => (
                <p key={`${row.playerId}-reason-${index}`} className="text-[11px] leading-snug text-[hsl(var(--ve-text-secondary))]">
                  {reason}
                </p>
              ))}
            </div>
          </div>
        )}

        {recentForm && (
          <div className="mb-2.5 grid grid-cols-4 gap-1.5 rounded-xl border border-[hsl(var(--ve-border)/0.24)] bg-[hsl(var(--ve-surface-raised)/0.24)] p-1.5">
            <RecentStat label="L15" value={`${recentForm.gamesChecked ?? 0}G`} />
            <RecentStat label="HR" value={recentForm.homeRuns ?? 0} />
            <RecentStat label="XBH" value={recentForm.extraBaseHits ?? 0} />
            <RecentStat label="SLG" value={typeof recentForm.slugging === 'number' ? recentForm.slugging.toFixed(3) : 'N/A'} />
          </div>
        )}

        <div className="mb-2 flex flex-wrap gap-1.5">
          <BreakdownChip label="Hitter" value={breakdown?.hitterPower} color="hsl(var(--ve-accent-gold))" />
          <BreakdownChip label="Pitcher" value={breakdown?.pitcherVulnerability} color="hsl(var(--ve-accent-cyan))" />
          <BreakdownChip label="Park" value={breakdown?.parkFactor} color="hsl(var(--ve-text-secondary))" />
          <BreakdownChip label="Recent" value={breakdown?.recentForm} color="hsl(var(--ve-accent-pink))" />
        </div>

        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-[10px] font-mono text-[hsl(var(--ve-text-muted))]">
            {row.team} vs {row.opponent} · {row.opponentPitcherName ?? row.opposingPitcher} · {row.venue ?? 'Unknown venue'}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {onAddLeg && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onAddLeg({ name: row.playerName, team: row.team } as MLBPlayer, { id: `hr-${row.playerId}`, market: 'Anytime HR', odds: parseAmericanOdds(row.impliedOdds), spec: `${row.playerName} Anytime HR`, gamePk: row.gamePk, playerId: row.playerId }); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddLeg({ name: row.playerName, team: row.team } as MLBPlayer, { id: `hr-${row.playerId}`, market: 'Anytime HR', odds: parseAmericanOdds(row.impliedOdds), spec: `${row.playerName} Anytime HR`, gamePk: row.gamePk, playerId: row.playerId });
                  }
                }}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-[hsl(var(--ve-accent-cyan)/0.38)] px-2 py-1 text-[10px] font-bold text-[hsl(var(--ve-accent-cyan))] hover:bg-[hsl(var(--ve-accent-cyan)/0.10)]">
                <Plus className="w-3 h-3" /> Parlay
              </div>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-[hsl(var(--ve-text-muted))] transition-colors group-hover:text-[hsl(var(--ve-text-secondary))]" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function HrTierView({ games, onSelect, onAddLeg }: Props) {
  const rows = games.flatMap((g) => g.rows);
  return (
    <div className="space-y-5">
      {TIERS.map((t) => {
        const list = rows.filter(t.match).sort((a, b) => b.hrEdge - a.hrEdge);
        if (list.length === 0) return null;
        return (
          <div key={t.key}>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="h-6 w-1.5 rounded-full" style={{ background: t.color }} />
              <div>
                <h3 className="text-base font-black" style={{ color: t.color }}>{t.title} <span className="font-mono text-xs text-[hsl(var(--ve-text-muted))]">({list.length})</span></h3>
                <p className="text-[11px] text-[hsl(var(--ve-text-muted))]">{t.sub}</p>
              </div>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {list.slice(0, 18).map((row) => <HrCard key={row.playerId} row={row} onSelect={() => onSelect(row)} onAddLeg={onAddLeg} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
