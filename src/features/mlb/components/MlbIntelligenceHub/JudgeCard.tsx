import React from 'react';
import { AURORA_PANEL_PREMIUM, AURORA_LABEL, AURORA_SECTION_HEADER, AURORA_SURFACE } from '../../../../theme/auroraTokens';
import PlayerHeadshot from '../../../../components/parlays/PlayerHeadshot';
import { AiJudge, AiJudgePick } from './types';
import { StatTile } from './StatTile';

const safeArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

function availabilityTone(status?: string) {
  const value = String(status ?? '').toLowerCase();
  if (value === 'confirmed') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (value === 'projected') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (value === 'avoid') return 'border-red-400/30 bg-red-400/10 text-red-200';
  return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
}

function pickTypeTone(pickType?: string) {
  const value = String(pickType ?? '').toUpperCase();
  if (value === 'AVOID') return 'border-red-400/30 bg-red-400/10 text-red-200';
  if (value === 'POWER_THREAT') return 'border-orange-400/30 bg-orange-400/10 text-orange-200';
  if (value === 'FORM_PLAY') return 'border-violet-400/30 bg-violet-400/10 text-violet-200';
  if (value === 'CLEAN_SCREEN') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (value === 'PREMIUM_EDGE') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  return AURORA_SURFACE + ' text-slate-300';
}

const JUDGE_SECTION_COPY: Record<string, { title: string; subtitle: string }> = {
  data_scout: {
    title: "Today's Safer HR Single",
    subtitle: 'One math-first HR single — cleaner data profile, fewer red flags.',
  },
  power_hunter: {
    title: "Today's Power Threat Single",
    subtitle: 'One raw HR upside single from power paths, pitcher vulnerability, and park leverage.',
  },
  momentum_reader: {
    title: "Today's Form Single",
    subtitle: 'One rhythm read — recent form and lineup volume on a single HR leg.',
  },
  risk_auditor: {
    title: "Today's Trap Avoid",
    subtitle: 'One caution profile — graded when the flagged player stays cold.',
  },
};

async function copyJudgeSingle(judge: AiJudge) {
  const pick = judge.topPick ?? safeArray<AiJudgePick>(judge.topPicks)[0];
  if (!pick) return;

  const lines = [
    `${judge.displayName} — Today's Single`,
    '',
    `${pick.playerName} — ${pick.singlePickLabel ?? pick.market} — ${pick.team} vs ${pick.opponent}`,
    '',
    'Built from VouchEdge AI Judge Leaderboard.',
    'Research only. Not betting advice.',
  ];

  await navigator.clipboard.writeText(lines.join('\n'));
}

function formatJudgeRecord(record: AiJudge['record']) {
  const base = `${record.won}-${record.lost}`;
  if (record.pending > 0) return `${base} (${record.pending} pending)`;
  if (record.graded === 0) return '0-0';
  return base;
}

export const JudgeCard = React.memo(function JudgeCard({ judge }: { judge: AiJudge }) {
  const isRisk = judge.id === 'risk_auditor';
  const pick = judge.topPick ?? safeArray<AiJudgePick>(judge.topPicks)[0] ?? null;
  const sectionCopy = JUDGE_SECTION_COPY[judge.id] ?? {
    title: isRisk ? "Today's Trap Avoid" : "Today's Single",
    subtitle: isRisk
      ? 'One warning profile tracked for trap accuracy.'
      : 'One specialty-filtered HR single per judge.',
  };

  return (
    <article className={`rounded-3xl ${AURORA_PANEL_PREMIUM} p-5 shadow-xl shadow-black/20`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className={`${AURORA_LABEL} text-emerald-300`}>
            {judge.specialty ?? (isRisk ? 'Trap Watch Agent' : 'AI Capper')}
          </div>
          <h3 className={`mt-1 ${AURORA_SECTION_HEADER}`}>{judge.displayName}</h3>
          <p className="mt-1 text-sm text-slate-400">{judge.tagline}</p>
          <p className="mt-2 max-w-2xl text-xs text-slate-500">{judge.persona}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <StatTile label="Win Rate" value={judge.winRate == null ? 'New' : `${judge.winRate}%`} tone="emerald" />
          <StatTile label="Trust" value={String(Math.round(Number(judge.trustScore ?? 50)))} tone="sky" />
          <StatTile label="Record" value={formatJudgeRecord(judge.record)} tone="slate" />
        </div>
      </div>

      <div className={`mt-5 rounded-2xl p-4 ${AURORA_SURFACE}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className={`${AURORA_LABEL} text-slate-500`}>
              {sectionCopy.title}
            </p>
            <p className="text-xs text-slate-400">
              {sectionCopy.subtitle}
              {pick?.gradeable ? ' · Tracking for win rate.' : pick ? ' · Preview only until confirmed.' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { void copyJudgeSingle(judge); }}
            disabled={!pick}
            className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Copy Single
          </button>
        </div>

        <div className="space-y-2">
          {!pick ? (
            <p className={`rounded-2xl p-3 text-sm text-slate-500 ${AURORA_SURFACE}`}>
              No judge pick available yet.
            </p>
          ) : (
            <div className={`rounded-2xl p-3 ${AURORA_SURFACE}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <PlayerHeadshot name={pick.playerName} playerId={pick.playerId} headshotUrl={pick.headshotUrl ?? pick.headshot} size={42} />
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white">
                      {pick.playerName}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {pick.team} vs {pick.opponent}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {pick.singlePickLabel ?? pick.market} · Agent Score {pick.agentScore}
                      {!isRisk ? ` · HR Edge ${pick.hrScore}` : ''}
                    </p>
                    {pick.judgeReason ? (
                      <p className="mt-1 text-[11px] text-slate-300">{pick.judgeReason}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-slate-500">
                      Pitcher: {pick.opponentPitcherName ?? 'TBD'} · Venue: {pick.venue ?? 'TBD'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span className={`rounded-full border px-2 py-1 ${AURORA_LABEL} ${pickTypeTone(pick.pickType)}`}>
                    {pick.singlePickLabel ?? pick.specialtyLabel ?? pick.pickType}
                  </span>
                  <span className={`rounded-full border px-2 py-1 ${AURORA_LABEL} ${availabilityTone(pick.availability?.status)}`}>
                    {pick.availability?.label ?? 'Availability unknown'}
                  </span>
                  <span className={`rounded-full px-2 py-1 ${AURORA_LABEL} ${
                    pick.gradeable
                      ? 'border border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                      : AURORA_SURFACE + ' text-slate-400'
                  }`}>
                    {pick.gradeable ? 'Tracking' : 'Preview only'}
                  </span>
                </div>
              </div>

              {isRisk && safeArray<string>(pick.warnings).length > 0 ? (
                <div className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-2">
                  {pick.warnings!.slice(0, 2).map((warning, i) => (
                    <p key={i} className="text-[11px] text-amber-200">⚠ {warning}</p>
                  ))}
                </div>
              ) : pick.availability?.reasons?.length ? (
                <div className="mt-2 text-[11px] text-slate-500">
                  {pick.availability.reasons.slice(0, 2).join(' · ')}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
});
