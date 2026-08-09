import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CloudSun,
  Eye,
  Gauge,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { openParlayAdd } from '../../lib/parlays/parlayAddContract';
import type { SlateMarketRadar, SlateRadarSummary } from './slateRadarModel';

interface SlateEdgeRadarWidgetProps {
  summary: SlateRadarSummary;
  onSectionChange: (section: string) => void;
}

interface SlateEdgeRadarPageProps extends SlateEdgeRadarWidgetProps {
  onBack?: () => void;
}

const MARKET_ACCENTS: Record<SlateMarketRadar['id'], string> = {
  home_runs: 'text-vouch-emerald border-vouch-emerald/35 bg-vouch-emerald/10',
  pitcher_ks: 'text-vouch-cyan border-vouch-cyan/35 bg-vouch-cyan/10',
  stolen_bases: 'text-fuchsia-200 border-fuchsia-300/35 bg-fuchsia-300/10',
  hits: 'text-amber-300 border-amber-300/35 bg-amber-300/10',
};

const VERDICT_TONES: Record<SlateMarketRadar['verdict'], string> = {
  research: 'border-vouch-emerald bg-vouch-emerald text-black shadow-[4px_4px_0_rgba(0,0,0,.55)]',
  selective: 'border-orange-300 bg-orange-300 text-black shadow-[4px_4px_0_rgba(0,0,0,.55)]',
  monitor: 'border-amber-300 bg-amber-300 text-black shadow-[4px_4px_0_rgba(0,0,0,.55)]',
  avoid: 'border-rose-300 bg-rose-300 text-black shadow-[4px_4px_0_rgba(0,0,0,.55)]',
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function stateCopy(state: SlateRadarSummary['slateState']) {
  if (state === 'loading') return 'Syncing slate';
  if (state === 'unavailable') return 'Sources degraded';
  if (state === 'no-slate') return 'No MLB slate';
  if (state === 'live') return 'Live context';
  if (state === 'postgame') return 'Postgame review';
  return 'Pregame research';
}

function MarketLaneRing({ market, compact = false }: { market: SlateMarketRadar; compact?: boolean }) {
  return (
    <div className={`grid shrink-0 place-items-center rounded-full border border-white/12 bg-black/45 ${compact ? 'h-14 w-14' : 'h-20 w-20'}`}>
      <div className="text-center">
        <p className={`font-mono font-black leading-none text-white ${compact ? 'text-base' : 'text-2xl'}`}>{market.shortLabel}</p>
        <p className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-white/35">lane</p>
      </div>
    </div>
  );
}

function PhysicalMetricReadout({
  label,
  displayValue,
  value,
}: {
  label: string;
  displayValue: string;
  value: number | null;
}) {
  return (
    <div className={`min-w-0 border px-3 py-3 ${value == null ? 'border-amber-300/18 bg-amber-300/[0.04]' : 'border-white/10 bg-white/[0.025]'}`}>
      <p className="truncate font-mono text-[8px] font-black uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className={`mt-2 truncate font-mono text-sm font-black tabular-nums ${value == null ? 'text-amber-100/55' : 'text-white/85'}`}>{displayValue}</p>
    </div>
  );
}

function SplitCollision({ market }: { market: SlateMarketRadar }) {
  const primary = market.physicalSplits[0];
  if (!primary) return null;

  return (
    <div className="border border-white/10 bg-black/28 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-white/38">{primary.label}</p>
        <p className="shrink-0 text-[10px] font-black uppercase tracking-wider text-vouch-cyan">{primary.verdict}</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2">
        <PhysicalMetricReadout label={primary.leftLabel} displayValue={primary.leftValue} value={primary.leftScore} />
        <span className="self-center font-mono text-[8px] font-black uppercase text-white/22">vs</span>
        <PhysicalMetricReadout label={primary.rightLabel} displayValue={primary.rightValue} value={primary.rightScore} />
      </div>
    </div>
  );
}

function edgeTone(direction: SlateMarketRadar['marketEdges'][number]['direction']) {
  if (direction === 'value' || direction === 'over') return 'border-vouch-emerald/35 bg-vouch-emerald/10 text-vouch-emerald';
  if (direction === 'under') return 'border-rose-300/35 bg-rose-500/10 text-rose-200';
  return 'border-amber-300/35 bg-amber-300/10 text-amber-100';
}

function MarketLineDelta({ market }: { market: SlateMarketRadar }) {
  const edge = market.marketEdges[0];
  if (!edge) return null;
  const awaiting = edge.direction === 'awaiting';
  const scaleMax = edge.scaleMax ?? 100;
  const unit = edge.valueUnit ?? '%';
  const modelPosition = edge.modelValue == null ? null : clampPercent((edge.modelValue / scaleMax) * 100);
  const marketPosition = edge.marketValue == null ? null : clampPercent((edge.marketValue / scaleMax) * 100);

  return (
    <div className="border border-white/10 bg-black/28 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/38">Model vs book line</p>
        <span className={`border px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider ${edgeTone(edge.direction)}`}>
          {edge.deltaLabel}
        </span>
      </div>
      {awaiting ? (
        <p className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/8 px-3 py-2 text-xs font-bold leading-5 text-amber-50/75">
          {edge.bookLine}
        </p>
      ) : (
        <div className="mt-3">
          <div className="flex justify-between font-mono text-[7px] text-white/25">
            <span>0{unit}</span><span>{scaleMax / 2}{unit}</span><span>{scaleMax}{unit} {unit === '%' ? 'probability' : 'projection'}</span>
          </div>
          <div className="relative mt-2 h-12">
            <div className="absolute inset-x-0 top-3 h-2 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.06)_0,rgba(255,255,255,.06)_1px,transparent_1px,transparent_10%),rgba(148,163,184,.08)]" />
            {modelPosition != null && marketPosition != null ? (
              <div className="absolute top-[14px] h-1 bg-vouch-emerald/70" style={{ left: `${Math.min(modelPosition, marketPosition)}%`, width: `${Math.abs(modelPosition - marketPosition)}%` }} />
            ) : null}
            {marketPosition != null ? (
              <div className="absolute top-1 -translate-x-1/2" style={{ left: `${marketPosition}%` }}>
                <span className="block h-4 w-4 rounded-full border-2 border-white/60 bg-slate-500" />
                <span className="absolute right-2 top-5 whitespace-nowrap font-mono text-[8px] text-white/45">BOOK {edge.marketValue?.toFixed(1)}{unit}</span>
              </div>
            ) : null}
            {modelPosition != null ? (
              <div className="absolute top-1 -translate-x-1/2" style={{ left: `${modelPosition}%` }}>
                <span className="block h-4 w-4 rounded-full border-2 border-white/85 bg-vouch-emerald shadow-[0_0_0_4px_rgba(52,211,153,.1)]" />
                <span className="absolute left-2 top-5 whitespace-nowrap font-mono text-[8px] text-vouch-emerald">MODEL {edge.modelValue?.toFixed(1)}{unit}</span>
              </div>
            ) : null}
          </div>
          <p className="mt-1 truncate text-[9px] text-white/35">{edge.subject} · {edge.bookLine}</p>
        </div>
      )}
    </div>
  );
}

function cautionBadge(caution: string) {
  const coverage = /^(Odds|Lineups|Weather)\s+\d+\/\d+/i.exec(caution);
  if (coverage) return coverage[0];
  const lower = caution.toLowerCase();
  if (lower.includes('book') || lower.includes('odds') || lower.includes('price')) return 'No odds';
  if (lower.includes('lineup')) return 'Lineups';
  if (lower.includes('forecast') || lower.includes('weather')) return 'Weather';
  if (lower.includes('strikeout') || lower.includes('whiff') || lower.includes('csw')) return 'K inputs';
  if (lower.includes('contact') || lower.includes('batting')) return 'Hit inputs';
  return 'Data cap';
}

function MicroBadges({ market }: { market: SlateMarketRadar }) {
  if (market.cautions.length === 0) {
    return (
      <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-vouch-emerald/35 bg-vouch-emerald/10 px-2.5 text-[10px] font-black uppercase tracking-wider text-vouch-emerald">
        <CheckCircle2 className="h-3 w-3" /> Clean inputs
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {market.cautions.slice(0, 3).map((caution) => (
        <span
          key={caution}
          title={caution}
          className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/12 px-2.5 text-[10px] font-black uppercase tracking-wider text-amber-100"
        >
          <AlertTriangle className="h-3 w-3 text-amber-300" /> {cautionBadge(caution)}
        </span>
      ))}
    </div>
  );
}

function MarketDecisionMatrix({
  markets,
  onSelectMarket,
}: {
  markets: SlateMarketRadar[];
  onSelectMarket: (market: SlateMarketRadar) => void;
}) {
  const rankedMarkets = markets.filter((market) => market.marketEdges.some((edge) => edge.verifiedComparison));
  const lockedMarkets = markets.filter((market) => market.marketEdges.every((edge) => !edge.verifiedComparison));

  return (
    <section className="overflow-hidden rounded-2xl border border-white/12 bg-ve-graphite/95 shadow-2xl" aria-label="Markets ranked by verified model edge">
      <div className="grid grid-cols-[1.05fr_1.15fr_1.15fr_.95fr] gap-4 border-b border-white/10 bg-black/35 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/38 max-lg:hidden">
        <p>Edge rank</p>
        <p>Model vs book</p>
        <p>Matchup collision</p>
        <p>Open targets</p>
      </div>
      <div className="divide-y divide-white/10">
        {rankedMarkets.map((market, index) => (
          <button
            key={market.id}
            type="button"
            onClick={() => onSelectMarket(market)}
            className="grid w-full gap-4 px-4 py-4 text-left transition hover:bg-white/[0.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-vouch-cyan lg:grid-cols-[1.05fr_1.15fr_1.15fr_.95fr] lg:items-center lg:px-5"
          >
            <div className="flex items-center gap-3">
              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border bg-black/35 font-mono text-lg font-black ${MARKET_ACCENTS[market.id]}`}>
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="text-base font-black leading-tight text-white">{market.label}</p>
                <div className="mt-2">
                  <MicroBadges market={market} />
                </div>
              </div>
            </div>

            <MarketLineDelta market={market} />
            <SplitCollision market={market} />

            <div className="flex items-center justify-between gap-3 lg:block">
              <span className={`inline-flex min-h-8 items-center rounded-md border-2 px-3 text-[10px] font-black uppercase tracking-wider ${VERDICT_TONES[market.verdict]}`}>
                View top {market.shortLabel}
              </span>
              <ArrowRight className="h-4 w-4 text-white/35 lg:mt-3" />
            </div>
          </button>
        ))}
      </div>
      {rankedMarkets.length === 0 ? (
        <div className="border-b border-white/10 px-5 py-6 text-center">
          <p className="font-mono text-xs font-black uppercase tracking-wider text-white/55">No verified model-market delta yet</p>
          <p className="mt-2 text-xs text-white/38">Priced markets will move here automatically when projections and sportsbook lines overlap.</p>
        </div>
      ) : null}
      {lockedMarkets.length > 0 ? (
        <div className="bg-black/30 p-3">
          <p className="mb-2 px-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] text-white/30">Awaiting market contracts</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {lockedMarkets.map((market) => (
              <button key={market.id} type="button" onClick={() => onSelectMarket(market)} className="flex min-h-12 items-center justify-between gap-3 border border-white/8 bg-black/25 px-3 text-left transition hover:border-amber-300/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">
                <span className="flex items-center gap-2 text-xs font-black text-white/60"><LockKeyhole className="h-3.5 w-3.5 text-amber-300/70" />{market.label}</span>
                <span className="font-mono text-[8px] uppercase text-white/28">{market.marketEdges[0]?.bookLine}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function slateArchetype(summary: SlateRadarSummary) {
  if (!summary.topMarket) {
    return {
      label: 'No verified edge yet',
      detail: 'The matchup data is useful for research, but no market has both a projection and sportsbook line required for a ranked edge.',
      icon: Eye,
    };
  }

  const leadingEdge = summary.topMarket.marketEdges[0];
  if ((leadingEdge?.edgePoints ?? 0) <= 0) {
    return {
      label: 'No positive priced edge',
      detail: `${summary.topMarket.label} has the closest verified comparison, but the model is not above the current market price.`,
      icon: Eye,
    };
  }

  return {
    label: `${summary.topMarket.label} leads`,
    detail: `${summary.topMarket.label} owns the largest positive verified model-market delta on the current slate.`,
    icon: Zap,
  };
}

function rankedEdges(summary: SlateRadarSummary) {
  return summary.markets.flatMap((market) => market.marketEdges
    .filter((edge) => edge.verifiedComparison)
    .map((edge) => ({ market, edge })))
    .sort((a, b) => Math.abs(b.edge.edgePoints ?? Number.NEGATIVE_INFINITY) - Math.abs(a.edge.edgePoints ?? Number.NEGATIVE_INFINITY));
}

function LineDisplacementTable({
  summary,
  onSelectMarket,
}: {
  summary: SlateRadarSummary;
  onSelectMarket: (market: SlateMarketRadar) => void;
}) {
  const rows = rankedEdges(summary).slice(0, 8);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/12 bg-ve-graphite/95" aria-labelledby="line-displacement-title">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
        <div>
          <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-vouch-cyan">Numerical decision matrix</p>
          <h2 id="line-displacement-title" className="mt-1 text-lg font-black text-white">Model vs sportsbook line</h2>
        </div>
        <p className="font-mono text-[8px] uppercase tracking-wider text-white/30">Official candidates with real prices only</p>
      </header>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <LockKeyhole className="mx-auto h-5 w-5 text-amber-300/70" />
          <p className="mt-3 text-sm font-black text-white/65">No comparable player lines are available.</p>
          <p className="mt-1 text-xs text-white/35">{summary.provider.status === 'error' ? 'The sportsbook response failed; see the exact request state in Decision guardrails.' : 'Lanes remain locked until an official player projection overlaps a posted sportsbook price.'}</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-black/25 font-mono text-[8px] uppercase tracking-[0.14em] text-white/30"><tr><th className="px-5 py-3">Market / player</th><th className="px-4 py-3">Book line</th><th className="px-4 py-3">Model projection</th><th className="px-4 py-3">Edge delta</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-white/8">
                {rows.map(({ market, edge }) => (
                  <tr key={edge.id} className="transition hover:bg-white/[0.025]">
                    <td className="px-5 py-4"><strong className="block text-sm text-white/85">{edge.subject}</strong><span className="mt-1 block font-mono text-[8px] uppercase text-white/30">{market.label} · {edge.candidate?.team ?? 'Team unavailable'}</span></td>
                    <td className="px-4 py-4 font-mono text-xs font-black text-white/65">{edge.bookLine}</td>
                    <td className="px-4 py-4 font-mono text-xs font-black text-white/75">{edge.modelProjection}</td>
                    <td className="px-4 py-4"><span className={`border px-2 py-1 font-mono text-xs font-black ${edgeTone(edge.direction)}`}>{edge.deltaLabel}</span></td>
                    <td className="px-5 py-4 text-right"><button type="button" onClick={() => onSelectMarket(market)} className="min-h-9 border border-white/12 bg-white/[0.03] px-3 text-[10px] font-black text-white/60 hover:border-vouch-cyan/30 hover:text-vouch-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-vouch-cyan">View targets</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-white/8 sm:hidden">
            {rows.map(({ market, edge }) => (
              <button key={edge.id} type="button" onClick={() => onSelectMarket(market)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-vouch-cyan">
                <span className="min-w-0"><strong className="block truncate text-sm text-white/85">{edge.subject}</strong><small className="mt-1 block truncate font-mono text-[8px] uppercase text-white/30">{market.shortLabel} · Book {edge.bookLine} · Model {edge.modelProjection}</small></span>
                <span className={`self-center border px-2 py-1 font-mono text-xs font-black ${edgeTone(edge.direction)}`}>{edge.deltaLabel}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function SlateMacroHero({
  summary,
  onSectionChange,
  onSelectMarket,
  onBack,
}: {
  summary: SlateRadarSummary;
  onSectionChange: (section: string) => void;
  onSelectMarket: (market: SlateMarketRadar) => void;
  onBack?: () => void;
}) {
  const archetype = slateArchetype(summary);
  const Icon = archetype.icon;
  const top = summary.topMarket;
  const topEdges = rankedEdges(summary).slice(0, 3);

  return (
    <section className="overflow-hidden rounded-2xl border border-vouch-cyan/20 bg-[radial-gradient(circle_at_top_left,rgba(0,240,255,.18),transparent_34%),linear-gradient(135deg,#071623,#050910_62%,#08110d)] p-5 shadow-[8px_8px_0_rgba(0,0,0,.42)] sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack ?? (() => onSectionChange('today'))}
          className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/12 bg-black/30 px-3 text-xs font-black text-white/55 transition hover:border-vouch-cyan/35 hover:text-vouch-cyan"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Today
        </button>
        <div className="flex flex-wrap justify-end gap-2">
          <span className={`rounded-md border px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-wider ${summary.provider.status === 'error' ? 'border-rose-300/35 bg-rose-500/10 text-rose-200' : summary.provider.status === 'loading' ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-vouch-emerald/30 bg-vouch-emerald/10 text-vouch-emerald'}`} title={summary.provider.message}>
            {summary.provider.status === 'live' ? `Odds live · ${summary.provider.quoteCount} quotes` : summary.provider.status === 'error' ? 'Odds feed error' : 'Odds loading'}
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-white/45">
            {summary.dateLabel} · {stateCopy(summary.slateState)}
          </span>
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border-2 border-vouch-cyan bg-vouch-cyan px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-black shadow-[4px_4px_0_rgba(0,0,0,.55)]">
            <Icon className="h-3.5 w-3.5" /> {archetype.label}
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">Today&apos;s market radar</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/58">{archetype.detail}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {top ? (
              <button
                type="button"
                onClick={() => onSectionChange(top.nextSection)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-vouch-emerald px-4 text-xs font-black text-black shadow-[5px_5px_0_rgba(0,0,0,.45)] transition hover:bg-vouch-emerald/90"
              >
                Research {top.shortLabel} evidence <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : null}
              <span className="inline-flex min-h-11 items-center rounded-xl border border-white/12 bg-black/30 px-4 font-mono text-[10px] font-bold uppercase tracking-wider text-white/45">
              No book line, no claimed edge
            </span>
          </div>
        </div>

        <div className="border border-white/10 bg-black/25">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white/45">Top verified comparisons</p>
            <p className="font-mono text-[8px] uppercase text-white/25">Model minus market</p>
          </div>
          {topEdges.length > 0 ? topEdges.map(({ market, edge }, index) => (
            <button key={edge.id} type="button" onClick={() => onSelectMarket(market)} className="grid w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 px-3 py-3 text-left last:border-b-0 hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-vouch-cyan">
              <span className="font-mono text-xs font-black text-white/28">{String(index + 1).padStart(2, '0')}</span>
              <span className="min-w-0"><strong className="block truncate text-xs text-white/80">{edge.subject}</strong><small className="mt-0.5 block truncate font-mono text-[8px] uppercase text-white/32">{market.shortLabel} · {edge.bookLine} vs {edge.modelProjection}</small></span>
              <span className="font-mono text-sm font-black text-vouch-emerald">{edge.deltaLabel}</span>
            </button>
          )) : (
            <div className="px-4 py-6 text-center"><LockKeyhole className="mx-auto h-4 w-4 text-amber-300/65" /><p className="mt-2 text-xs font-bold text-white/48">Sportsbook overlap is still pending.</p><p className="mt-1 text-[10px] text-white/28">No player is promoted without a comparable line.</p></div>
          )}
        </div>
      </div>
    </section>
  );
}

function addEdgeCandidateToList(edge: SlateMarketRadar['marketEdges'][number]) {
  const candidate = edge.candidate;
  if (!candidate || candidate.playerId == null || candidate.truthStatus === 'blocked') return;

  openParlayAdd({
    player: {
      id: String(candidate.playerId),
      name: candidate.playerName,
      team: candidate.team,
      position: '',
      headshot: candidate.headshotUrl ?? '',
      propositions: [],
      ...(candidate.gamePk == null ? {} : { resolvedGamePk: String(candidate.gamePk) }),
    },
    propHint: {
      id: `slate-radar-${candidate.stableId}`,
      market: 'Home Runs',
      odds: candidate.bookOdds,
      spec: `${candidate.playerName} 1+ Home Run`,
      gamePk: candidate.gamePk ?? undefined,
      playerId: candidate.playerId,
    },
    initialFamily: 'home_runs',
    isPitcher: false,
    source: 'slate_radar',
    dataStatus: candidate.truthStatus === 'official' ? 'official' : candidate.truthStatus === 'projected' ? 'projected' : 'unknown',
    reasoningSnapshot: candidate.primaryReason,
    riskSnapshot: candidate.primaryRisk,
  });
}

function MarketTargetDrawer({
  market,
  onClose,
  onSectionChange,
}: {
  market: SlateMarketRadar | null;
  onClose: () => void;
  onSectionChange: (section: string) => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!market) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [market, onClose]);

  if (!market || typeof document === 'undefined') return null;
  const targets = market.marketEdges.filter((edge) => edge.verifiedComparison).slice(0, 3);
  const awaiting = targets.length === 0;

  return createPortal(
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-labelledby="market-target-drawer-title">
      <button type="button" aria-label="Close market targets" onClick={onClose} className="absolute inset-0 cursor-default bg-black/72 backdrop-blur-sm" />
      <aside ref={drawerRef} className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-white/12 bg-ve-graphite shadow-[-24px_0_70px_rgba(0,0,0,.5)]">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-vouch-cyan">Market target drawer</p>
            <h2 id="market-target-drawer-title" className="mt-1 text-xl font-black text-white">{market.label}</h2>
            <p className="mt-1 text-xs leading-5 text-white/42">{awaiting ? 'This lane is locked until projections and sportsbook lines overlap.' : 'Ranked by model probability minus market-implied probability.'}</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} title="Close" className="grid h-10 w-10 shrink-0 place-items-center border border-white/12 bg-black/30 text-white/55 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-vouch-cyan"><X className="h-4 w-4" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {awaiting ? (
            <div className="border border-amber-300/20 bg-amber-300/[0.05] p-5">
              <LockKeyhole className="h-5 w-5 text-amber-300" />
              <p className="mt-3 text-sm font-black text-white">{market.marketEdges[0]?.bookLine}</p>
              <p className="mt-2 text-xs leading-5 text-white/45">{market.marketEdges[0]?.detail}</p>
              <div className="mt-4"><MicroBadges market={market} /></div>
            </div>
          ) : (
            <div className="space-y-3">
              {targets.map((edge, index) => {
                const addable = Boolean(edge.addable && edge.candidate && edge.candidate.playerId != null);
                return (
                  <article key={edge.id} className="border border-white/10 bg-black/25 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="font-mono text-[8px] font-black uppercase tracking-wider text-white/28">Target {String(index + 1).padStart(2, '0')}</p><h3 className="mt-1 truncate text-base font-black text-white">{edge.subject}</h3><p className="mt-1 text-[10px] text-white/38">{edge.candidate?.team} vs {edge.candidate?.opponent}</p></div>
                      <span className={`shrink-0 border px-2.5 py-1 font-mono text-xs font-black ${edgeTone(edge.direction)}`}>{edge.deltaLabel}</span>
                    </div>
                    <div className="mt-4"><MarketLineDelta market={{ ...market, marketEdges: [edge] }} /></div>
                    <p className="mt-3 text-xs leading-5 text-white/48">{edge.detail}</p>
                    <button type="button" disabled={!addable} onClick={() => { onClose(); addEdgeCandidateToList(edge); }} title={addable ? 'Review this researched pick in My List' : 'A positive, official, gradeable edge is required'} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-vouch-emerald/35 bg-vouch-emerald/10 px-4 text-xs font-black text-vouch-emerald transition hover:bg-vouch-emerald/15 disabled:cursor-not-allowed disabled:border-white/8 disabled:bg-white/[0.02] disabled:text-white/25"><Plus className="h-3.5 w-3.5" />Review in My List</button>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer className="border-t border-white/10 p-4 sm:px-6">
          <button type="button" onClick={() => { onClose(); onSectionChange(market.nextSection); }} className="inline-flex min-h-10 w-full items-center justify-center gap-2 border border-white/12 bg-white/[0.03] px-4 text-xs font-black text-white/65 transition hover:border-vouch-cyan/30 hover:text-vouch-cyan">Open full {market.label} evidence <ArrowRight className="h-3.5 w-3.5" /></button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}

export function SlateEdgeRadarWidget({ summary, onSectionChange }: SlateEdgeRadarWidgetProps) {
  const top = summary.topMarket;

  return (
    <section id="today-slate-edge-radar" className="rounded-2xl border border-white/12 bg-gradient-to-r from-[#0b1625]/90 via-[#07111e]/90 to-[#040810]/90 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-vouch-cyan" />
            <h2 className="text-xs font-black uppercase tracking-[0.16em] text-white">Slate Edge Radar</h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-white/45">Which market deserves the most research before you bet.</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-white/45">
          {stateCopy(summary.slateState)}
        </span>
      </div>

      {top ? (
        <div className="mt-4 rounded-2xl border border-vouch-emerald/20 bg-vouch-emerald/[0.06] p-3 shadow-[5px_5px_0_rgba(0,0,0,.28)]">
          <div className="flex items-center gap-3">
            <MarketLaneRing market={top} compact />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-vouch-emerald">{top.edgeLabel}</p>
              <p className="mt-1 text-base font-black leading-tight text-white">{top.label}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-white/50">{top.marketEdges[0]?.deltaLabel ?? 'Awaiting line delta'}</p>
            </div>
          </div>
          <div className="mt-3">
            <MicroBadges market={top} />
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm font-bold leading-6 text-amber-100/80">
          No market gets a green light from the current data.
        </div>
      )}

      <div className="mt-3 divide-y divide-white/8 border border-white/10 bg-black/25">
        {summary.markets.map((market) => (
          <div key={market.id} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2 px-2.5 py-2.5">
            <p className="truncate text-[10px] font-black uppercase tracking-wider text-white/55">{market.shortLabel}</p>
            <p className="truncate font-mono text-[8px] uppercase tracking-wider text-white/35">{market.marketEdges[0]?.direction === 'awaiting' ? market.marketEdges[0]?.bookLine : `${market.marketEdges[0]?.subject} model vs book`}</p>
            <p className="text-right font-mono text-[10px] font-black text-white">{market.marketEdges[0]?.direction === 'awaiting' ? 'WAIT' : market.marketEdges[0]?.deltaLabel}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onSectionChange('slate_radar')}
        className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-vouch-cyan/25 bg-vouch-cyan/10 px-4 text-xs font-black text-vouch-cyan transition hover:bg-vouch-cyan/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vouch-cyan"
      >
        Open full radar <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </section>
  );
}

export default function SlateEdgeRadarPage({ summary, onSectionChange, onBack }: SlateEdgeRadarPageProps) {
  const [selectedMarket, setSelectedMarket] = useState<SlateMarketRadar | null>(null);
  const closeDrawer = useCallback(() => setSelectedMarket(null), []);

  return (
    <>
      <main className="min-h-screen w-full bg-ve-obsidian pb-24 text-white">
        <div className="mx-auto max-w-7xl space-y-6 px-3 py-4 sm:px-6 lg:px-8">
          <SlateMacroHero summary={summary} onSectionChange={onSectionChange} onSelectMarket={setSelectedMarket} onBack={onBack} />

          <LineDisplacementTable summary={summary} onSelectMarket={setSelectedMarket} />

          <MarketDecisionMatrix markets={summary.markets} onSelectMarket={setSelectedMarket} />

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="rounded-2xl border border-white/12 bg-ve-graphite/90 p-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-vouch-cyan" />
                <h2 className="text-xs font-black uppercase tracking-[0.16em] text-white">How the radar thinks</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MethodPillar icon={Target} title="Market edge" body="Show model-vs-book deltas when a sportsbook line exists; otherwise mark the lane as awaiting market data." />
                <MethodPillar icon={CloudSun} title="Forecast context" body="Park and weather can move HR carry; lineup and slate timing change plate-appearance volume." />
                <MethodPillar icon={ShieldCheck} title="Truth cap" body="Missing odds, missing forecasts, and incomplete market contracts become visible blocker badges." />
              </div>
              <div className="mt-4 space-y-2">
                {summary.methodNotes.map((note) => (
                  <p key={note} className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs leading-5 text-white/50">{note}</p>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                <h2 className="text-xs font-black uppercase tracking-[0.16em] text-amber-100">Decision guardrails</h2>
              </div>
              <div className="mt-4 space-y-3 text-xs leading-5 text-amber-50/70">
                {(summary.dataWarnings.length > 0 ? summary.dataWarnings : ['No blocking source warning detected. Still verify odds and lineup status before betting.']).map((warning) => (
                  <p key={warning} className="rounded-xl border border-amber-300/18 bg-black/20 p-3">{warning}</p>
                ))}
                <p className="rounded-xl border border-amber-300/18 bg-black/20 p-3">
                  Expected value needs a fair probability and a book price. Without a market line, the radar will not claim a betting edge.
                </p>
              </div>
            </aside>
          </section>
        </div>
      </main>
      <MarketTargetDrawer market={selectedMarket} onClose={closeDrawer} onSectionChange={onSectionChange} />
    </>
  );
}

function MethodPillar({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <Icon className="h-4 w-4 text-vouch-emerald" />
      <p className="mt-3 text-sm font-black text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-white/45">{body}</p>
    </div>
  );
}

export function SlateRadarTrendIcon() {
  return <TrendingUp className="h-4 w-4" />;
}
