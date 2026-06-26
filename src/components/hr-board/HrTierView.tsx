import React from 'react';
import { Flame, Plus, ChevronRight } from 'lucide-react';
import type { HrBoardGame, HrBoardRow } from '../../types/hrBoard';
import type { MLBPlayer } from '../../types';
import { Card, RiskBadge, StatusBadge, ScorePill } from '../ui/primitives';

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

const HrCard: React.FC<{ row: HrBoardRow; onSelect: () => void; onAddLeg?: Props['onAddLeg'] }> = ({ row, onSelect, onAddLeg }) => {
  return (
    <Card onClick={onSelect} className="group">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={row.headshot} alt={row.playerName} loading="lazy" referrerPolicy="no-referrer" className="w-9 h-9 rounded-lg object-cover bg-slate-900 border border-slate-800 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-black truncate flex items-center gap-1">{row.playerName}{row.hrEdge >= 75 && <Flame className="w-3 h-3 text-orange-400" />}</p>
            <p className="text-[10px] text-slate-500 truncate">{row.team} · vs {row.opposingPitcher}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={row.projectionType === 'Confirmed' ? 'Confirmed' : row.projectionType === 'Live' ? 'Live' : 'Projected'} />
          <RiskBadge risk={row.riskLabel} />
        </div>
      </div>

      {/* Plain-English context */}
      <p className="text-[11px] text-slate-400 mb-2 leading-snug">
        {row.projectionType === 'Confirmed' ? `Confirmed starter${row.battingOrder ? `, batting order ${row.battingOrder}` : ''}. ` : 'Projected bat. '}
        {row.hrMultiplier && row.hrMultiplier !== 'N/A' ? `Park HR factor ${row.hrMultiplier}x. ` : row.parkFactor && row.parkFactor !== 'N/A' ? `Park factor ${row.parkFactor}. ` : 'Park data unavailable. '}
        {row.weatherSource === 'unavailable' || row.weatherBoost === null || row.weatherBoost === undefined
          ? 'Weather unavailable. '
          : `Weather boost ${row.weatherBoost > 0 ? '+' : ''}${row.weatherBoost}%. `}
        Faces {row.opposingPitcher || 'TBD'}, HR/9 risk {row.pitcherVulnerability}.
      </p>

      <div className="flex items-center gap-2">
        <ScorePill label="HR Score" value={row.hrEdge} color="#fb923c" />
        <ScorePill label="Odds" value={row.impliedOdds || "N/A"} />
        <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: FORM_COLOR[row.formTag] ?? '#94a3b8' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: FORM_COLOR[row.formTag] ?? '#94a3b8' }} />{row.formTag}
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.slice(0, 18).map((row) => <HrCard key={row.playerId} row={row} onSelect={() => onSelect(row)} onAddLeg={onAddLeg} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
