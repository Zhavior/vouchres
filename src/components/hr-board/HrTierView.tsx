import React from 'react';
import { Flame, Plus, ChevronRight } from 'lucide-react';
import type { HrBoardGame, HrBoardRow } from '../../types/hrBoard';
import type { MLBPlayer } from '../../types';
import { Card, RiskBadge, ScorePill } from '../ui/primitives';

interface Props {
  games: HrBoardGame[];
  onSelect: (row: HrBoardRow) => void;
  onAddLeg?: (player: MLBPlayer, prop: { id: string; market: string; odds: number; spec: string }) => void;
}

const TIERS: { key: string; title: string; sub: string; color: string; match: (r: HrBoardRow) => boolean }[] = [
  { key: 't1', title: 'Tier 1 — Best HR Targets', sub: 'Elite/strong modeled spots', color: '#34d399', match: (r) => r.grade === 'A+' || r.grade === 'A' },
  { key: 't2', title: 'Tier 2 — Strong But Riskier', sub: 'Playable with more variance', color: '#22d3ee', match: (r) => r.grade === 'B' },
  { key: 'sneaky', title: 'Sneaky HRs', sub: 'Lower-obvious, higher risk', color: '#a78bfa', match: (r) => r.grade === 'C' },
  { key: 'avoid', title: 'Avoid / Trap Picks', sub: 'Weak modeled HR equity', color: '#f87171', match: (r) => r.grade === 'D' || r.grade === 'F' },
];

function americanToDecimal(am?: string | null): number {
  const n = parseInt(String(am ?? ""), 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) return 1;
  return n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
}

const FORM_COLOR: Record<string, string> = { Hot: '#fb7185', Average: '#94a3b8', Cold: '#60a5fa', Slump: '#64748b' };

function LineupBadge({ lineupStatus }: { lineupStatus?: string }) {
  const projected = lineupStatus === 'projected_unconfirmed';
  const confirmed = lineupStatus === 'confirmed';
  const label = confirmed ? 'Confirmed' : projected ? 'Preview' : 'Projected';
  const color = confirmed ? '#34d399' : projected ? '#fbbf24' : '#94a3b8';

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
    <div className="rounded-lg bg-slate-950/45 px-2 py-1.5 text-center">
      <div className="text-[8px] font-mono uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-xs font-mono font-black text-slate-100">{value}</div>
    </div>
  );
}

const HrCard: React.FC<{ row: HrBoardRow; onSelect: () => void; onAddLeg?: Props['onAddLeg'] }> = ({ row, onSelect, onAddLeg }) => {
  const recentForm = row.recentForm;
  const breakdown = row.scoreBreakdown;
  const topReasons = row.reasons?.slice(0, 4) ?? [];
  const projectedWarning = row.lineupStatus === 'projected_unconfirmed';

  return (
    <Card onClick={onSelect} className="group relative overflow-hidden bg-slate-900/55 p-0">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400/70 via-blue-500/40 to-transparent" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={row.headshot} alt={row.playerName} loading="lazy" referrerPolicy="no-referrer" className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-slate-700 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-black truncate flex items-center gap-1">
                <span className="text-[10px] font-mono text-slate-500">#{row.rank ?? '-'}</span>
                <span className="truncate">{row.playerName}</span>
                {row.hrEdge >= 75 && <Flame className="w-3 h-3 text-orange-400" />}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{row.team} vs {row.opponent}</p>
              <p className="text-[10px] text-slate-400 truncate">{row.opponentPitcherName ?? row.opposingPitcher}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <LineupBadge lineupStatus={row.lineupStatus} />
            <RiskBadge risk={row.riskLabel} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <ScorePill label="HR Score" value={row.hrEdge} color="#fb923c" />
          <ScorePill label="P.Vuln" value={row.pitcherVulnerability} color="#22d3ee" />
          <ScorePill label="Vouch" value={row.vouchScore} color="#34d399" />
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
          <span className="font-mono">{row.venue ?? 'Unknown venue'}</span>
          <span className="inline-flex items-center gap-1" style={{ color: FORM_COLOR[row.formTag] ?? '#94a3b8' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: FORM_COLOR[row.formTag] ?? '#94a3b8' }} />{row.formTag}
          </span>
        </div>

        {projectedWarning && (
          <div className="mb-2 rounded-lg border border-amber-400/20 bg-amber-400/8 px-2.5 py-2 text-[11px] text-amber-100">
            Official lineup not posted yet.
          </div>
        )}

        {topReasons.length > 0 && (
          <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950/35 px-3 py-2.5">
            <div className="mb-1 text-[10px] font-mono font-bold uppercase tracking-wide text-slate-500">Why this pick?</div>
            <div className="space-y-1">
              {topReasons.map((reason, index) => (
                <p key={`${row.playerId}-reason-${index}`} className="text-[11px] leading-snug text-slate-300">
                  {reason}
                </p>
              ))}
            </div>
          </div>
        )}

        {recentForm && (
          <div className="mb-3 grid grid-cols-4 gap-1.5 rounded-xl border border-slate-800 bg-slate-950/30 p-1.5">
            <RecentStat label="L15" value={`${recentForm.gamesChecked ?? 0}G`} />
            <RecentStat label="HR" value={recentForm.homeRuns ?? 0} />
            <RecentStat label="XBH" value={recentForm.extraBaseHits ?? 0} />
            <RecentStat label="SLG" value={typeof recentForm.slugging === 'number' ? recentForm.slugging.toFixed(3) : 'N/A'} />
          </div>
        )}

        <div className="mb-2 flex flex-wrap gap-1.5">
          <BreakdownChip label="Hitter" value={breakdown?.hitterPower} color="#fb923c" />
          <BreakdownChip label="Pitcher" value={breakdown?.pitcherVulnerability} color="#22d3ee" />
          <BreakdownChip label="Park" value={breakdown?.parkFactor} color="#34d399" />
          <BreakdownChip label="Recent" value={breakdown?.recentForm} color="#c084fc" />
        </div>

        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-[10px] font-mono text-slate-400">
            {row.team} vs {row.opponent} · {row.opponentPitcherName ?? row.opposingPitcher} · {row.venue ?? 'Unknown venue'}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {onAddLeg && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onAddLeg({ name: row.playerName, team: row.team } as MLBPlayer, { id: `hr-${row.playerId}`, market: 'Anytime HR', odds: americanToDecimal(row.impliedOdds), spec: `${row.playerName} Anytime HR` }); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddLeg({ name: row.playerName, team: row.team } as MLBPlayer, { id: `hr-${row.playerId}`, market: 'Anytime HR', odds: americanToDecimal(row.impliedOdds), spec: `${row.playerName} Anytime HR` });
                  }
                }}
                className="flex items-center gap-1 text-[10px] font-bold text-sky-400 border border-sky-500/40 rounded-lg px-2 py-1 hover:bg-sky-500/10 cursor-pointer">
                <Plus className="w-3 h-3" /> Parlay
              </div>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function HrTierView({ games, onSelect, onAddLeg }: Props) {
  const rows = games.flatMap((g) => g.rows);
  return (
    <div className="space-y-7">
      {TIERS.map((t) => {
        const list = rows.filter(t.match).sort((a, b) => b.hrEdge - a.hrEdge);
        if (list.length === 0) return null;
        return (
          <div key={t.key}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-6 rounded-full" style={{ background: t.color }} />
              <div>
                <h3 className="text-base font-black" style={{ color: t.color }}>{t.title} <span className="text-slate-500 font-mono text-xs">({list.length})</span></h3>
                <p className="text-[11px] text-slate-500">{t.sub}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {list.slice(0, 18).map((row) => <HrCard key={row.playerId} row={row} onSelect={() => onSelect(row)} onAddLeg={onAddLeg} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
