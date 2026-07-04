import React from 'react';
import type { HrBoardGame, HrBoardRow } from '../../types/hrBoard';
import { GameHeader } from './HrBoardTable';
import HrCard, { type OnAddLeg } from './HrCard';
import { TIERS } from './tiers';

interface Props {
  game: HrBoardGame;
  onSelect: (row: HrBoardRow) => void;
  onAddLeg?: OnAddLeg;
}

/**
 * The premium, trading-terminal hierarchy: one matchup panel (GameHeader,
 * reused from the old flat table) containing this game's rows regrouped
 * into the same tier bands the cross-game leaderboard uses, each row
 * rendered as an HrCard. Replaces the flat <table> feed per game.
 */
export default function HrGameTierBoard({ game, onSelect, onAddLeg }: Props) {
  if (game.rows.length === 0) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-800/80 bg-[#0b1120] shadow-xl shadow-black/10">
      <GameHeader game={game} />

      <div className="space-y-4 p-3 sm:p-4">
        {TIERS.map((t) => {
          const list = game.rows.filter(t.match).sort((a, b) => (b.hrEdge ?? 0) - (a.hrEdge ?? 0));
          if (list.length === 0) return null;

          return (
            <div key={t.key}>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="h-5 w-1 rounded-full" style={{ background: t.color }} />
                <div>
                  <h4 className="text-sm font-black" style={{ color: t.color }}>
                    {t.title}{' '}
                    <span className="font-mono text-[11px] text-[hsl(var(--ve-text-muted))]">({list.length})</span>
                  </h4>
                  <p className="text-[10px] text-[hsl(var(--ve-text-muted))]">{t.sub}</p>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((row) => (
                  <HrCard key={row.playerId} row={row} onSelect={() => onSelect(row)} onAddLeg={onAddLeg} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
