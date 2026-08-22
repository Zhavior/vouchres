import React from 'react';
import { AURORA_PANEL_PREMIUM, AURORA_LABEL, AURORA_SECTION_HEADER, AURORA_SURFACE } from '../../../../theme/auroraTokens';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import { Candidate } from './types';
import { StatTile } from './StatTile';

const safeArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

const num = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const pct = (value: unknown) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n <= 1) return `${(n * 100).toFixed(1)}%`;
  return `${n.toFixed(1)}%`;
};

const cleanName = (c: Candidate) => c.playerName || c.name || 'Unknown player';
const cleanOpponent = (c: Candidate) => c.opponent || c.opponentTeam || 'TBD';
const cleanPitcher = (c: Candidate) => c.opponentPitcherName || 'Pitcher TBD';

export const CandidateCard = React.memo(function CandidateCard({
  c,
  rank,
  onSelect,
}: {
  c: Candidate;
  rank: number;
  onSelect: (candidate: Candidate) => void;
}) {
  const score = num(c.hrScore, 0);
  const reasons = safeArray<string>(c.reasons).slice(0, 3);
  const warnings = safeArray<string>(c.warnings).slice(0, 2);
  const breakdown = c.scoreBreakdown ?? {};

  return (
    <button
      type="button"
      onClick={() => onSelect(c)}
      className={`group w-full rounded-3xl ${AURORA_PANEL_PREMIUM} p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-vouch-cyan/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vouch-cyan/60`}
      aria-label={`Open ${cleanName(c)} inside AI Edge Lab`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <PlayerHeadshot name={cleanName(c)} playerId={c.playerId} headshotUrl={c.headshotUrl ?? c.headshot} size={54} />
          <div className="min-w-0">
            <p className={`${AURORA_LABEL} text-slate-500`}>#{rank}</p>
            <h3 className={`truncate ${AURORA_SECTION_HEADER}`}>{cleanName(c)}</h3>
            <p className="text-xs text-slate-400">
              {c.team ?? 'TBD'} vs {cleanOpponent(c)} · {cleanPitcher(c)}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`${AURORA_LABEL} text-slate-500`}>HR edge</p>
          <p className="text-2xl font-black text-vouch-cyan">{score}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <StatTile label="Tier" value={c.riskTier ?? c.confidenceTier ?? 'Watch'} tone="amber" />
        <StatTile label="Est. HR" value={pct(c.estimatedHrProbability)} tone="emerald" />
        <StatTile label="Venue" value={<span className="text-sm">{c.venue ?? 'TBD'}</span>} />
      </div>

      <div className={`mt-3 rounded-2xl p-3 ${AURORA_SURFACE}`}>
        <p className={`mb-2 ${AURORA_LABEL} text-slate-500`}>
          AI read
        </p>
        {reasons.length ? (
          <ul className="space-y-1">
            {reasons.map((r, i) => (
              <li key={i} className="text-xs text-slate-300">• {r}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">No reasons returned yet.</p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {Object.entries(breakdown).slice(0, 5).map(([key, value]) => (
          <span key={key} className={`rounded-full px-2 py-1 ${AURORA_SURFACE} ${AURORA_LABEL} text-slate-300`}>
            {key}: {Math.round(num(value))}
          </span>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-2">
          {warnings.map((w, i) => (
            <p key={i} className="text-[11px] text-amber-200">⚠ {w}</p>
          ))}
        </div>
      )}
    </button>
  );
});
