import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Database, RefreshCw, ShieldCheck, Target, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { BrainPageShell } from './BrainPageShell';
import { Z8_LABEL, Z8_PANEL_PREMIUM, Z8_PANEL } from '../../theme/z8Tokens';

type LedgerPick = {
  decisionKey: string;
  date: string;
  playerName: string;
  team: string;
  opponent: string;
  rank: number;
  score: number;
  confidence: number;
  tier: string;
  evidenceQuality: 'official' | 'preview';
  result: 'pending' | 'hit' | 'miss' | 'void';
};

type Performance = {
  total: number;
  resolved: number;
  pending: number;
  hits: number;
  misses: number;
  voids: number;
  hitRate: number | null;
  sampleWarning: string | null;
};

type MarketLedger = { picks: LedgerPick[]; performance: Performance };

type LedgerResponse = {
  picks: LedgerPick[];
  performance: Performance;
  modelRecords: Array<{
    engineVersion: string;
    samples: number;
    readyForJudgment: boolean;
    evaluation: null | { brierScore: number; logLoss: number; calibrationError: number };
    excluded: { missingProbability: number; invalidSnapshot: number; temporalLeakage: number };
  }>;
  stolenBase: MarketLedger;
  pitcherStrikeouts: MarketLedger;
};

function MarketSummary({ label, target, market }: { label: string; target: string; market?: MarketLedger }) {
  const performance = market?.performance ?? {
    total: 0,
    resolved: 0,
    pending: 0,
    hits: 0,
    misses: 0,
    voids: 0,
    hitRate: null,
    sampleWarning: null,
  };

  return (
    <article className="brain-market-card rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`${Z8_LABEL} text-slate-400`}>{label}</div>
          <h2 className="mt-1 text-base font-bold text-white">{target}</h2>
        </div>
        <div className="text-right">
          <strong className="font-mono text-2xl font-black text-vouch-emerald">
            {performance.hitRate == null ? '—' : `${performance.hitRate}%`}
          </strong>
          <span className="block text-[9px] font-mono text-slate-400 uppercase font-bold">Hit Rate</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center font-mono text-xs">
        <div className="p-2 rounded-lg bg-white/5">
          <span className="text-[9px] uppercase text-slate-400 block font-bold">Recorded</span>
          <strong className="text-white font-bold text-sm">{performance.total}</strong>
        </div>
        <div className="p-2 rounded-lg bg-vouch-emerald/10 border border-vouch-emerald/20">
          <span className="text-[9px] uppercase text-vouch-emerald block font-bold">Hits</span>
          <strong className="text-vouch-emerald font-bold text-sm">{performance.hits}</strong>
        </div>
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <span className="text-[9px] uppercase text-rose-300 block font-bold">Misses</span>
          <strong className="text-rose-300 font-bold text-sm">{performance.misses}</strong>
        </div>
      </div>
    </article>
  );
}

export default function BrainPerformancePage({ onNavigate }: { onNavigate: (section: string) => void }) {
  const query = useQuery({
    queryKey: ['brain', 'ledger', 'mlb', 'home-run'],
    queryFn: () => apiClient.get<LedgerResponse>('/api/intelligence/brain/mlb/performance'),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const ledger = query.data;
  const hasData = ledger && (ledger.picks?.length > 0 || ledger.performance?.total > 0);

  return (
    <BrainPageShell active="performance" onNavigate={onNavigate}>
      {/* Top Banner */}
      <section className="brain-panel brain-callout p-5 sm:p-6 rounded-2xl border border-vouch-cyan/30 bg-vouch-cyan/5">
        <div className="flex gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-vouch-emerald/30 bg-vouch-emerald/10 text-vouch-emerald">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <div className={`${Z8_LABEL} text-vouch-emerald font-bold`}>Immutable Win / Loss Accountability Ledger</div>
            <h2 className="mt-1 text-xl font-black text-white">Truth-First Database Performance Record</h2>
            <p className="mt-2 max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-300">
              Brain decisions are snapshotted pregame with cryptographic SHA-256 hashes. 
              Only official MLB play-by-play box scores settle final Win (Hit), Loss (Miss), or Push (Void) outcomes.
              Zero simulated or fake historical data is ever shown.
            </p>
          </div>
        </div>
      </section>

      {query.isLoading && (
        <section className="brain-panel flex min-h-48 items-center justify-center gap-3 p-6 rounded-2xl border border-white/10 bg-black/40">
          <RefreshCw className="h-5 w-5 animate-spin text-vouch-cyan" />
          <span className={`${Z8_LABEL} text-slate-300`}>Querying database performance ledger...</span>
        </section>
      )}

      {query.isError && (
        <section className="brain-panel p-8 text-center rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <Activity className="mx-auto h-8 w-8 text-rose-400" />
          <h2 className="mt-3 text-lg font-bold text-white">Database Ledger Disconnected</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Unable to connect to the verified decision database. Truth protocol prohibits displaying simulated outcomes.
          </p>
        </section>
      )}

      {!query.isLoading && !query.isError && !hasData && (
        <div className="space-y-6">
          <section className="brain-panel p-8 text-center rounded-2xl border border-white/10 bg-black/40 space-y-3">
            <Clock className="mx-auto h-10 w-10 text-vouch-cyan animate-pulse" />
            <h2 className="text-xl font-black text-white">Awaiting Official Game Box Scores</h2>
            <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              All Brain decisions for today's slate are currently <strong className="text-amber-300 font-mono font-bold uppercase">PENDING</strong>. 
              As MLB games conclude and official play-by-play feeds close, wins (Hits) and losses (Misses) will settle automatically in real time.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 text-xs text-vouch-cyan font-mono font-bold">
              <AlertCircle className="h-3.5 w-3.5" /> Zero Fake Results · Truth-First Pipeline
            </div>
          </section>

          {/* Clean Empty Market Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MarketSummary label="Home Run Market" target="Any Player HR" />
            <MarketSummary label="Stolen Base Market" target="Any Player SB" />
            <MarketSummary label="Pitcher Strikeout Market" target="5+ Strikeouts Target" />
          </section>
        </div>
      )}

      {hasData && ledger && (
        <div className="space-y-6">
          {/* Main Record Header */}
          <section className="brain-panel p-5 sm:p-6 rounded-2xl border border-white/10 bg-black/40">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className={`${Z8_LABEL} text-vouch-cyan`}>Verified Home Run Record</div>
                <h2 className="mt-1 text-2xl font-black text-white tracking-tight">Model Outcomes & Win Rate</h2>
              </div>
              <div className="text-left sm:text-right">
                <strong className="font-mono text-4xl font-black text-vouch-emerald">
                  {ledger.performance.hitRate == null ? '—' : `${ledger.performance.hitRate}%`}
                </strong>
                <span className={`${Z8_LABEL} block text-slate-400`}>Verified Hit Rate</span>
              </div>
            </div>

            <div className="brain-stat-grid mt-5">
              {[
                ['Total Recorded', ledger.performance.total],
                ['Resolved', ledger.performance.resolved],
                ['Hits (Wins)', ledger.performance.hits],
                ['Misses (Losses)', ledger.performance.misses],
                ['Pending Games', ledger.performance.pending],
              ].map(([label, value]) => (
                <div key={String(label)} className="brain-stat p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className={`${Z8_LABEL} text-slate-400`}>{label}</span>
                  <strong className="mt-1 block font-mono text-2xl font-black text-white">{value}</strong>
                </div>
              ))}
            </div>
          </section>

          {/* Market Summary Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MarketSummary label="Home Run Market" target="Any Player HR" market={{ picks: ledger.picks, performance: ledger.performance }} />
            <MarketSummary label="Stolen Base Market" target="Any Player SB" market={ledger.stolenBase} />
            <MarketSummary label="Pitcher Strikeout Market" target="5+ Strikeouts Target" market={ledger.pitcherStrikeouts} />
          </section>

          {/* Decision History Table */}
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
            <article className="brain-panel p-5 sm:p-6 rounded-2xl border border-white/10 bg-black/40">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <div className={`${Z8_LABEL} text-vouch-cyan`}>Decision History Ledger</div>
                  <h2 className="mt-1 text-lg font-black text-white uppercase tracking-wider">Frozen Wins & Losses</h2>
                </div>
                <Target className="h-5 w-5 text-vouch-cyan" />
              </div>

              <div className="mt-4 space-y-2.5">
                {ledger.picks.map((pick) => {
                  const isHit = pick.result === 'hit';
                  const isMiss = pick.result === 'miss';
                  const isPending = pick.result === 'pending';
                  const isVoid = pick.result === 'void';

                  return (
                    <div
                      key={pick.decisionKey}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:border-white/20 transition"
                    >
                      <div className="min-w-0">
                        <strong className="block truncate text-sm font-bold text-white">{pick.playerName}</strong>
                        <span className="mt-0.5 block font-mono text-[10px] uppercase text-slate-400">
                          {pick.date} · {pick.team} vs {pick.opponent} · Score {pick.score} · {pick.evidenceQuality}
                        </span>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 font-mono text-xs font-black uppercase px-3 py-1 rounded-lg border">
                        {isHit && (
                          <span className="flex items-center gap-1 text-vouch-emerald border-vouch-emerald/40 bg-vouch-emerald/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5" /> WIN (HIT)
                          </span>
                        )}
                        {isMiss && (
                          <span className="flex items-center gap-1 text-rose-300 border-rose-500/40 bg-rose-500/10 px-2 py-0.5 rounded-full">
                            <XCircle className="h-3.5 w-3.5" /> LOSS (MISS)
                          </span>
                        )}
                        {isPending && (
                          <span className="flex items-center gap-1 text-amber-300 border-amber-400/40 bg-amber-400/10 px-2 py-0.5 rounded-full">
                            <Clock className="h-3.5 w-3.5" /> PENDING
                          </span>
                        )}
                        {isVoid && (
                          <span className="flex items-center gap-1 text-slate-400 border-slate-500/40 bg-slate-500/10 px-2 py-0.5 rounded-full">
                            <AlertCircle className="h-3.5 w-3.5" /> VOID (PUSH)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            {/* Protocol Card */}
            <aside className="brain-panel p-5 sm:p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4">
              <Database className="h-6 w-6 text-vouch-cyan" />
              <div>
                <div className={`${Z8_LABEL} text-vouch-cyan font-bold`}>Integrity Protocol</div>
                <h2 className="mt-1 text-lg font-bold text-white">How Wins & Losses Are Recorded</h2>
              </div>
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-mono">
                {[
                  'Every Brain decision is snapshotted before game time.',
                  'SHA-256 cryptographic hashes lock odds and features.',
                  'Final MLB Stats API play-by-play automatically settles outcomes.',
                  'Hits (Wins) and Misses (Losses) update in real time with 0 manual intervention.',
                ].map((item, index) => (
                  <div key={item} className="flex gap-2.5 p-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
                    <span className="font-bold text-vouch-cyan shrink-0">0{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        </div>
      )}
    </BrainPageShell>
  );
}
