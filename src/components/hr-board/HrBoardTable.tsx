import React from 'react';
import { MapPin, CloudSun, Flame } from 'lucide-react';
import type { HrBoardGame, HrBoardRow as Row } from '../../types/hrBoard';
import HrBoardRow, { GradeBadge, Move, FORM_COLOR, edgeColor } from './HrBoardRow';

const COLUMNS = [
  'Player', 'Context', 'HR Score', 'Model Signals', 'Vouch', 'Data / Status', '',
];

const ENV_COLOR: Record<HrBoardGame['environmentTag'], string> = {
  'Hitter-Friendly': '#34d399', 'Pitcher-Friendly': '#f87171', Neutral: '#94a3b8',
};

function GameHeader({ game }: { game: HrBoardGame }) {
  const c = ENV_COLOR[game.environmentTag];
  const time = game.gameTime ? new Date(game.gameTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-black text-slate-100">{game.matchup}</h3>
        {time && <span className="text-[11px] text-slate-500 font-mono">{time}</span>}
        <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full border uppercase tracking-wide"
          style={{ color: c, borderColor: c + '55', background: c + '15' }}>{game.environmentTag}</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {game.parkNote}</span>
        <span className="flex items-center gap-1"><CloudSun className="w-3 h-3" /> {game.weatherNote}</span>
        <span>{game.rankedHitters} hitters</span>
      </div>
    </div>
  );
}

const MobileCard: React.FC<{ row: Row; onClick: () => void }> = ({ row, onClick }) => {
  const topReasons = row.reasons?.slice(0, 3) ?? [];
  const recentForm = row.recentForm;
  const breakdown = row.scoreBreakdown;

  return (
    <div onClick={onClick} className="p-3.5 rounded-2xl bg-slate-900/55 border border-slate-800/80 active:bg-slate-800/40 cursor-pointer shadow-lg shadow-black/10">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src={row.headshot} alt={row.playerName} loading="lazy" referrerPolicy="no-referrer" className="w-10 h-10 rounded-xl object-cover bg-slate-900 border border-slate-700 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-100 truncate flex items-center gap-1">
              <span className="text-[10px] font-mono text-slate-500">#{row.rank ?? '-'}</span>
              {row.playerName}
              {row.hrEdge >= 75 && <Flame className="w-3 h-3 text-orange-400" />}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">{row.team} vs {row.opponent} · {row.opponentPitcherName ?? row.opposingPitcher}</p>
          </div>
        </div>
        <GradeBadge grade={row.grade} />
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-orange-400/25 bg-orange-400/10 px-2 py-2 text-center">
          <p className="text-[9px] font-mono uppercase text-orange-200/70">HR Score</p>
          <p className="text-lg font-mono font-black leading-none" style={{ color: edgeColor(row.hrEdge) }}>{row.hrEdge}</p>
        </div>
        <div className="rounded-xl border border-sky-400/20 bg-sky-400/10 px-2 py-2 text-center">
          <p className="text-[9px] font-mono uppercase text-sky-200/70">P.Vuln</p>
          <p className="text-lg font-mono font-black leading-none" style={{ color: edgeColor(row.pitcherVulnerability) }}>{row.pitcherVulnerability}</p>
        </div>
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-2 py-2 text-center">
          <p className="text-[9px] font-mono uppercase text-emerald-200/70">Data</p>
          <p className="text-lg font-mono font-black leading-none text-emerald-300">{row.dataConfidence}%</p>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-1 text-[10px] font-mono font-bold text-sky-300">
          {row.riskLabel}
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-950/50 px-2 py-1 text-[10px] font-mono font-bold text-slate-300">
          {row.lineupStatus === 'confirmed' ? 'CONFIRMED' : row.lineupStatus === 'projected_unconfirmed' ? 'PREVIEW' : 'PROJECTED'}
        </span>
      </div>

      {row.lineupStatus === 'projected_unconfirmed' && (
        <div className="mb-2 rounded-lg border border-amber-400/20 bg-amber-400/8 px-2.5 py-2 text-[11px] text-amber-100">
          Official lineup not posted yet.
        </div>
      )}

      {topReasons.length > 0 && (
        <div className="mb-2 rounded-lg border border-slate-800 bg-slate-950/35 px-2.5 py-2">
          <div className="mb-1 text-[10px] font-mono uppercase tracking-wide text-slate-500">Why this pick?</div>
          <div className="space-y-1">
            {topReasons.map((reason, index) => (
              <p key={`${row.playerId}-mobile-reason-${index}`} className="text-[11px] leading-snug text-slate-300">
                {reason}
              </p>
            ))}
          </div>
        </div>
      )}

      {recentForm && (
        <div className="mb-2 grid grid-cols-4 gap-2 text-center">
          <Stat label="L15" value={`${recentForm.gamesChecked ?? 0}G`} />
          <Stat label="HR" value={String(recentForm.homeRuns ?? 0)} />
          <Stat label="XBH" value={String(recentForm.extraBaseHits ?? 0)} />
          <Stat label="SLG" value={typeof recentForm.slugging === 'number' ? recentForm.slugging.toFixed(3) : 'N/A'} />
        </div>
      )}

      <div className="mb-2 flex flex-wrap gap-1.5 text-[10px] font-mono">
        <span className="rounded-full bg-slate-950/60 px-2 py-1 text-orange-300">Hitter {Math.round(Number(breakdown?.hitterPower ?? 0))}</span>
        <span className="rounded-full bg-slate-950/60 px-2 py-1 text-sky-300">Pitcher {Math.round(Number(breakdown?.pitcherVulnerability ?? 0))}</span>
        <span className="rounded-full bg-slate-950/60 px-2 py-1 text-emerald-300">Park {Math.round(Number(breakdown?.parkFactor ?? 0))}</span>
        <span className="rounded-full bg-slate-950/60 px-2 py-1 text-fuchsia-300">Recent {Math.round(Number(breakdown?.recentForm ?? 0))}</span>
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-500">
        <span>{row.venue ?? 'Unknown venue'}</span>
        <Move pct={row.lineMovement} />
      </div>
    </div>
  );
};

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[8px] text-slate-600 font-mono tracking-wider">{label}</p>
      <p className="text-xs font-mono font-bold" style={{ color: color ?? '#e2e8f0' }}>{value}</p>
    </div>
  );
}

const HrBoardTable: React.FC<{ game: HrBoardGame; onSelect: (row: Row) => void }> = ({ game, onSelect }) => {
  if (game.rows.length === 0) return null;
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-800/80 mb-4 bg-[#0b1120] shadow-xl shadow-black/10">
      <GameHeader game={game} />

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto group">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-950/95 backdrop-blur">
              {COLUMNS.map((c, i) => (
                <th key={`${c}-${i}`} className={`px-4 py-2.5 text-[9px] font-mono uppercase tracking-wider text-slate-500 whitespace-nowrap ${i === 0 ? 'sticky left-0 bg-slate-950/95' : ''}`}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {game.rows.map((row) => <HrBoardRow key={row.playerId} row={row} onClick={() => onSelect(row)} />)}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden p-2 space-y-2">
        {game.rows.map((row) => <MobileCard key={row.playerId} row={row} onClick={() => onSelect(row)} />)}
      </div>
    </div>
  );
};

export default HrBoardTable;
