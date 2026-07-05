import React from 'react';
import type { HrWatchRow } from '../../types/hrWatch';
import { ChevronRight, Wind } from 'lucide-react';

interface HrPlayerCardProps {
  player: HrWatchRow;
  onClick: () => void;
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-amber-400';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 70) return 'text-blue-400';
  return 'text-purple-400';
}

function getScoreBg(score: number) {
  if (score >= 90) return 'bg-amber-400';
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 70) return 'bg-blue-400';
  return 'bg-purple-400';
}

export const HrPlayerCard = ({ player, onClick }: HrPlayerCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl border border-white/[0.06] bg-[#090C13] p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-[#0D111A]"
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 ${getScoreBg(player.hrScore)}`} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-black leading-tight tracking-tight text-slate-50">
            {player.playerName}
          </h3>
          <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            {player.team} vs {player.opponent}
          </p>
        </div>

        <div className={`font-mono text-3xl font-black leading-none ${getScoreColor(player.hrScore)}`}>
          {player.hrScore}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <Metric label="Edge" value={player.vouchScore != null ? `${player.vouchScore}%` : '—'} />
        <Metric label="Conf" value={player.dataConfidence != null ? `${Math.round(player.dataConfidence)}%` : '—'} />
        <Metric label="Pitcher" value={player.pitcherName || 'TBD'} />
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-white/[0.05] pt-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Badge>AI</Badge>
          {/* BARREL badge intentionally omitted until real Statcast barrel data is joined to rows — never faked. */}
          {player.oddsLabel && (
            <span className="inline-flex max-w-[120px] items-center gap-1 truncate rounded-md bg-white/[0.04] px-1.5 py-1 font-mono text-[10px] uppercase text-zinc-400">
              <Wind className="h-3 w-3 shrink-0 text-emerald-400" />
              {player.oddsLabel}
            </span>
          )}
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" />
      </div>
    </button>
  );
};

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/[0.04] bg-black/25 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-[0.16em] text-zinc-600">{label}</p>
      <p className="truncate font-mono text-[11px] font-semibold text-zinc-300">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-white/[0.06] bg-white/[0.04] px-1.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">
      {children}
    </span>
  );
}
