import React, { useMemo, useState } from 'react';
import { Radio, Clock, Sparkles, RefreshCw, Lock, CheckCircle2, XCircle, CircleDot } from 'lucide-react';
import type { Parlay } from '../types';
import { bucketParlays, lockCountdown, earliestStart } from '../lib/parlayLifecycle';

interface Props {
  parlays: Parlay[];
  onGenerate?: () => void;
  generating?: boolean;
}

const LEG_ICON: Record<string, React.ReactNode> = {
  WON: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  LOST: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
  VOID: <CircleDot className="w-3.5 h-3.5 text-slate-500" />,
  PENDING: <CircleDot className="w-3.5 h-3.5 text-slate-600" />,
};

function ParlayCard({ p, live }: { p: Parlay; live: boolean }) {
  const start = earliestStart(p);
  const startLabel = start ? start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'TBD';
  return (
    <div className={`rounded-2xl border bg-slate-950/50 overflow-hidden ${live ? 'border-emerald-500/30' : 'border-slate-800/70'}`}>
      <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-800/50">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {p.aiGenerated && <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
            <span className="text-sm font-black text-slate-100 truncate">{p.title}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className={`rounded px-1.5 py-0.5 font-bold ${p.riskTier === 'LOW' ? 'bg-emerald-500/15 text-emerald-300' : p.riskTier === 'HIGH' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>{p.riskTier}</span>
            <span>{p.legs.length} legs</span>
            <span className="font-mono text-sky-400">{p.totalOdds}</span>
            <span>· first pitch {startLabel}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {live ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
              <Clock className="w-3.5 h-3.5" /> {lockCountdown(p)}
            </span>
          )}
        </div>
      </div>
      <div className="divide-y divide-slate-800/30">
        {p.legs.map((l) => (
          <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
            {LEG_ICON[l.status] ?? LEG_ICON.PENDING}
            <span className="flex-1 min-w-0 text-sm text-slate-200 truncate">{l.selection}</span>
            {l.actual != null && <span className="text-[10px] font-mono text-slate-500">actual {l.actual}</span>}
            <span className="text-xs font-mono text-sky-400">+{l.odds.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LiveParlaysPage({ parlays, onGenerate, generating }: Props) {
  const [tab, setTab] = useState<'upcoming' | 'live'>('upcoming');
  const buckets = useMemo(() => bucketParlays(parlays), [parlays]);
  const list = tab === 'live' ? buckets.live : buckets.upcoming;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/20 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="mb-2 inline-block rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
              Live Parlays
            </span>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10">
                <Radio className="h-4 w-4 text-emerald-300" />
              </span>
              AI Parlays
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              AI-built from confirmed starters. <span className="text-amber-300">Upcoming</span> parlays lock 30 min before first pitch and move to <span className="text-emerald-300">Live</span>, then auto-grade to Results when games end.
            </p>
          </div>
          {onGenerate && (
            <button
              onClick={onGenerate}
              disabled={generating}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
              Generate Today's Parlays
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {([
            { id: 'upcoming', label: `Upcoming (${buckets.upcoming.length})`, icon: Clock },
            { id: 'live', label: `Live (${buckets.live.length})`, icon: Radio },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors ${
                tab === t.id ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {list.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/50 bg-slate-950/40 p-10 text-center">
            {tab === 'upcoming' ? <Clock className="mx-auto h-8 w-8 text-slate-700" /> : <Lock className="mx-auto h-8 w-8 text-slate-700" />}
            <p className="mt-3 text-sm text-slate-500">
              {tab === 'upcoming'
                ? 'No upcoming parlays. The AI builds the slate once confirmed lineups post — or hit "Generate Today\'s Parlays".'
                : 'No live parlays right now. Upcoming parlays appear here 30 min before first pitch.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((p) => (
              <React.Fragment key={p.id}>
                <ParlayCard p={p} live={tab === 'live'} />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
