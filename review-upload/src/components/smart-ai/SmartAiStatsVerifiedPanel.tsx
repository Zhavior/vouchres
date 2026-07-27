import { useMemo } from 'react';
import {
  Activity,
  Award,
  CheckCircle2,
  Cloud,
  Database,
  Gauge,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';
import { VerifiedDataNotice } from '../pro';
import type { RealCandidate } from './smartAiEngine.logic';
import {
  Z8_EMERALD,
  Z8_LABEL,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
  Z8_STAT_CHIP,
} from '../../theme/z8Tokens';

interface BoardStats {
  total: number;
  confirmed: number;
  games: number;
  avgConfidence: number | null;
}

interface SmartAiStatsVerifiedPanelProps {
  candidates: RealCandidate[];
  loading: boolean;
  boardStats: BoardStats;
}

const DATA_SOURCES = [
  {
    label: 'MLB StatsAPI',
    detail: 'Season stats, probable pitchers, lineup status, career batter-vs-pitcher.',
    status: 'live' as const,
  },
  {
    label: 'Baseball Savant',
    detail: 'Season Statcast quality — xwOBA, barrel rate, hard-hit rate, exit velocity.',
    status: 'live' as const,
  },
  {
    label: 'Open-Meteo',
    detail: 'First-pitch weather forecast. Roofed venues flagged; nothing estimated.',
    status: 'live' as const,
  },
  {
    label: 'Park factors',
    detail: 'Sourced venue context from the validated HR board pipeline.',
    status: 'live' as const,
  },
  {
    label: 'Sportsbook odds',
    detail: 'Not connected. Model estimates are never saved as market prices.',
    status: 'blocked' as const,
  },
] as const;

const TIER_ORDER = ['elite', 'strong', 'watchlist', 'thin', 'avoid'] as const;

export function SmartAiStatsVerifiedPanel({
  candidates,
  loading,
  boardStats,
}: SmartAiStatsVerifiedPanelProps) {
  const quality = useMemo(() => {
    const withPitcher = candidates.filter(
      (c) => c.opponentPitcherName && c.opponentPitcherName !== 'TBD',
    ).length;
    const withPark = candidates.filter((c) => typeof c.parkFactor === 'number').length;
    const withConfidence = candidates.filter((c) => typeof c.dataConfidence === 'number').length;
    const withWarnings = candidates.filter((c) => (c.boardWarnings?.length ?? 0) > 0).length;
    const projected = candidates.length - boardStats.confirmed;

    const tiers: Record<string, number> = {};
    for (const c of candidates) {
      const tier = c.confidenceTier ?? 'unknown';
      tiers[tier] = (tiers[tier] ?? 0) + 1;
    }

    return { withPitcher, withPark, withConfidence, withWarnings, projected, tiers };
  }, [candidates, boardStats.confirmed]);

  const feedVariant = loading
    ? 'coming-soon'
    : candidates.length > 0
      ? 'no-data'
      : 'feed-required';

  const feedTitle = loading
    ? 'Loading verified HR board'
    : candidates.length > 0
      ? 'Verified HR board connected'
      : 'No verified candidates yet';

  const feedDetail = loading
    ? 'Fetching today\'s validated pipeline — nothing is generated to fill gaps.'
    : candidates.length > 0
      ? `${boardStats.total} candidates from the live MLB HR board. Confirmed lineups only when officially posted.`
      : 'Lineups may not be posted yet. V.A.I will not fabricate players or stats.';

  return (
    <div className="space-y-5" id="vai-stats-verified-panel">
      <VerifiedDataNotice variant={feedVariant} title={feedTitle} detail={feedDetail} />

      {/* Board metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4" id="stats-verified-metrics">
        <div className={`${Z8_STAT_CHIP} flex items-center justify-between`}>
          <div>
            <span className={`${Z8_LABEL} block text-white/40`}>Validated Candidates</span>
            <span className="z8-tabular-nums mt-1 block text-lg font-mono font-black text-white">
              {loading ? '—' : boardStats.total}
            </span>
          </div>
          <Database className="h-5 w-5 text-vouch-cyan" />
        </div>
        <div className={`${Z8_STAT_CHIP} flex items-center justify-between`}>
          <div>
            <span className={`${Z8_LABEL} block text-white/40`}>Confirmed Lineups</span>
            <span className={`z8-tabular-nums mt-1 block text-lg font-mono font-black ${Z8_EMERALD}`}>
              {loading ? '—' : boardStats.confirmed}
            </span>
          </div>
          <CheckCircle2 className={`h-5 w-5 ${Z8_EMERALD}`} />
        </div>
        <div className={`${Z8_STAT_CHIP} flex items-center justify-between`}>
          <div>
            <span className={`${Z8_LABEL} block text-white/40`}>Games Covered</span>
            <span className="z8-tabular-nums mt-1 block text-lg font-mono font-black text-white">
              {loading ? '—' : boardStats.games}
            </span>
          </div>
          <Activity className="h-5 w-5 text-vouch-cyan/80" />
        </div>
        <div className={`${Z8_STAT_CHIP} flex items-center justify-between`}>
          <div>
            <span className={`${Z8_LABEL} block text-white/40`}>Avg Data Confidence</span>
            <span className="z8-tabular-nums mt-1 block text-lg font-mono font-black text-vouch-cyan">
              {loading || boardStats.avgConfidence === null ? '—' : `${boardStats.avgConfidence}%`}
            </span>
          </div>
          <Gauge className="h-5 w-5 text-vouch-cyan/80" />
        </div>
      </div>

      {/* Data completeness */}
      <section className={`${Z8_PANEL_PREMIUM} rounded-[2rem] p-5 sm:p-6`}>
        <div className={Z8_SECTION_HEADER}>
          <div className={`${Z8_LABEL} flex items-center gap-2 text-vouch-cyan`}>
            <Target className="h-3.5 w-3.5" />
            Data completeness
          </div>
          <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
            Today&apos;s board field coverage
          </h2>
          <p className="max-w-3xl text-xs text-white/45 sm:text-sm">
            Honest counts from the current candidate pool — missing fields are flagged, never invented.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Probable pitcher posted', value: quality.withPitcher, total: candidates.length },
            { label: 'Park factor present', value: quality.withPark, total: candidates.length },
            { label: 'Data confidence scored', value: quality.withConfidence, total: candidates.length },
            { label: 'Confirmed lineup', value: boardStats.confirmed, total: candidates.length },
            { label: 'Projected preview', value: quality.projected, total: candidates.length },
            { label: 'Board warnings', value: quality.withWarnings, total: candidates.length },
          ].map((row) => {
            const pct =
              row.total > 0 ? Math.round((row.value / row.total) * 100) : null;
            return (
              <div key={row.label} className={Z8_STAT_CHIP}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-white/70">{row.label}</span>
                  <span className="z8-tabular-nums text-sm font-mono font-black text-white">
                    {loading ? '—' : `${row.value}/${row.total}`}
                  </span>
                </div>
                {pct !== null && !loading && (
                  <div className="mt-2 h-1.5 rounded-full bg-black/40">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-vouch-cyan/70 to-vouch-emerald/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Confidence tier distribution */}
      {!loading && candidates.length > 0 && (
        <section className={`${Z8_PANEL_PREMIUM} rounded-[2rem] p-5 sm:p-6`}>
          <div className={Z8_SECTION_HEADER}>
            <div className={`${Z8_LABEL} flex items-center gap-2 text-vouch-emerald`}>
              <TrendingUp className="h-3.5 w-3.5" />
              Confidence tiers
            </div>
            <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
              Board tier distribution
            </h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {TIER_ORDER.map((tier) => {
              const count = quality.tiers[tier] ?? 0;
              if (count === 0) return null;
              return (
                <span
                  key={tier}
                  className="rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[11px] font-mono font-black uppercase tracking-wide text-white/80"
                >
                  {tier} · {count}
                </span>
              );
            })}
            {(quality.tiers.unknown ?? 0) > 0 && (
              <span className="rounded-full border border-amber-300/20 bg-amber-400/5 px-3 py-1.5 text-[11px] font-mono font-black uppercase tracking-wide text-amber-200/90">
                ungraded · {quality.tiers.unknown}
              </span>
            )}
          </div>
        </section>
      )}

      {/* Data source catalog */}
      <section className={`${Z8_PANEL_PREMIUM} rounded-[2rem] p-5 sm:p-6`}>
        <div className={Z8_SECTION_HEADER}>
          <div className={`${Z8_LABEL} flex items-center gap-2 text-vouch-cyan`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified feeds
          </div>
          <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
            Data source catalog
          </h2>
          <p className="max-w-3xl text-xs text-white/45 sm:text-sm">
            Every signal in V.A.I traces to a named source or is explicitly marked unavailable.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          {DATA_SOURCES.map((source) => (
            <div
              key={source.label}
              className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/25 px-4 py-3"
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                  source.status === 'live'
                    ? 'border-vouch-emerald/30 bg-vouch-emerald/10 text-vouch-emerald'
                    : 'border-white/10 bg-black/40 text-white/35'
                }`}
              >
                {source.status === 'live' ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Cloud className="h-3.5 w-3.5" />
                )}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white">{source.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider ${
                      source.status === 'live'
                        ? 'border border-vouch-emerald/25 bg-vouch-emerald/10 text-vouch-emerald'
                        : 'border border-white/10 bg-black/40 text-white/40'
                    }`}
                  >
                    {source.status === 'live' ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-white/45">{source.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Research data policy */}
      <div className={`${Z8_PANEL_PREMIUM} flex items-start gap-3 rounded-2xl p-5`} id="stats-verified-policy">
        <Award className="mt-0.5 h-5 w-5 flex-shrink-0 text-vouch-cyan" />
        <div className="space-y-1 text-xs text-white/45">
          <h4 className="font-bold text-white">Research Data Policy</h4>
          <p className="leading-relaxed">
            Candidates come from the validated HR board pipeline: real MLB season stats, probable pitchers with confirmed
            throwing hand where posted, and sourced park factors. First-pitch weather is a real Open-Meteo forecast with roofed
            venues flagged; batter-vs-pitcher history is real MLB career data; season Statcast quality (xwOBA, barrel rate,
            hard-hit rate) comes from Baseball Savant leaderboards. Sportsbook odds are not connected and are never
            estimated. Model HR probabilities are research estimates — not betting advice and not market prices. Verify player
            detail in the <b>Player Research Console</b> before trusting any single signal.
          </p>
        </div>
      </div>
    </div>
  );
}
