import React from 'react';
import { motion } from 'motion/react';
import { Lock, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuditSummary, type AuditedHypothesis } from '../../hooks/public/useAuditSummary';

/**
 * 05 / AUDITED_RECORD — the proof module that sits above the sign-up.
 *
 * Every number is a count over `hr_feature_snapshots`, the append-only pregame
 * capture table. The receipt column is the first 12 characters of the SHA-256
 * canonical hash of the feature vector the model was holding before first pitch,
 * and the outcome column is the real HR feed for that slate.
 *
 * When the ledger has nothing in it, this section says the ledger has nothing in
 * it. A proof module that manufactures its own proof would undo the entire
 * argument the page is making.
 */

function MetricCard({
  value,
  label,
  outcome,
  icon: Icon,
  tone = 'emerald',
}: {
  value: string;
  label: string;
  outcome: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone?: 'emerald' | 'cyan' | 'neutral';
}) {
  const accent =
    tone === 'emerald' ? 'text-ve-emerald' : tone === 'cyan' ? 'text-ve-cyan' : 'text-white';
  return (
    <div className="border border-white/5 bg-white/[0.02] p-8">
      <Icon size={16} className={`${accent} mb-6`} />
      <p className={`text-4xl font-bold italic tracking-tighter ${accent}`}>{value}</p>
      <p className="terminal-text mt-3">{label}</p>
      <p className="mt-3 text-sm font-light leading-relaxed text-white/40">{outcome}</p>
    </div>
  );
}

function OutcomeCell({ row }: { row: AuditedHypothesis }) {
  if (row.actualHomeRuns == null) {
    return <span className="font-mono text-[10px] uppercase tracking-widest text-white/25">No feed</span>;
  }
  const hit = row.actualHomeRuns > 0;
  return (
    <span
      className={`inline-flex border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
        hit ? 'border-ve-emerald/40 text-ve-emerald' : 'border-ve-red/40 text-ve-red'
      }`}
    >
      {hit ? `${row.actualHomeRuns} HR` : 'No HR'}
    </span>
  );
}

export default function AuditedTrackRecord() {
  const audit = useAuditSummary();

  return (
    <section id="record" className="scroll-mt-20 border-y border-white/5 bg-obsidian-900 px-6 py-32">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-16 max-w-3xl">
          <span className="terminal-text mb-4 block text-ve-emerald">05 / AUDITED_RECORD</span>
          <h2 className="text-5xl font-bold italic leading-tight tracking-tighter text-white md:text-6xl">
            The record is the product. <br />
            <span className="text-white/20">Not the highlight reel.</span>
          </h2>

          {/* Jargon translation for the badge the industry recognises. */}
          <p className="mt-8 border-l border-ve-emerald/30 pl-4 text-base font-light leading-relaxed text-white/50">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ve-emerald">
              Immutable trust ledger →{' '}
            </span>
            Every hypothesis is hashed and written to an append-only table before first pitch. There
            is no update path and no delete path for any role, so a loss cannot quietly disappear
            from the history the way a deleted post does.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          <MetricCard
            icon={Lock}
            value={audit.isLoading ? '···' : audit.slatesLogged.toLocaleString()}
            label="Audited slates logged"
            outcome="Days where the model's pregame state was captured before a single pitch was thrown."
          />
          <MetricCard
            icon={ShieldCheck}
            tone="cyan"
            value={
              audit.isLoading
                ? '···'
                : audit.coverageRatePct != null
                  ? `${audit.coverageRatePct}%`
                  : 'No ledger'
            }
            label="Model coverage rate"
            outcome="Share of captures that cleared every point-in-time rule: taken pre-first-pitch, lineup known, opposing arm resolved."
          />
          <MetricCard
            icon={Trash2}
            tone="neutral"
            value={audit.isLoading ? '···' : String(audit.deletedPicks)}
            label="Deleted picks"
            outcome="Enforced by the schema, not by policy — the table exposes no way to revise or remove a capture."
          />
        </motion.div>

        {/* Recent locked hypotheses, pregame score against what actually happened. */}
        <div className="mt-4 border border-white/5 bg-white/[0.02]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-6 py-4">
            <span className="terminal-text text-ve-emerald">Recent locked hypotheses</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-white/25">
              Pregame HRPI vs. actual outcome
            </span>
          </div>

          {audit.isLoading ? (
            <p className="px-6 py-12 text-center font-mono text-[10px] uppercase tracking-widest text-white/25">
              Reading the ledger
            </p>
          ) : audit.recent.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                No pregame captures in the ledger yet
              </p>
              <p className="mx-auto mt-3 max-w-lg text-sm font-light leading-relaxed text-white/35">
                The capture job writes one row per candidate before first pitch. Until it has run for
                a slate there is nothing here to audit, and nothing is shown in its place.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Slate', 'Hypothesis', 'Pregame HRPI', 'Coverage', 'Receipt', 'Outcome'].map((head) => (
                      <th
                        key={head}
                        className="px-6 py-3 font-mono text-[9px] font-bold uppercase tracking-widest text-white/30"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audit.recent.map((row) => (
                    <tr key={`${row.slateDate}-${row.receipt}`} className="border-b border-white/5 last:border-b-0">
                      <td className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-white/40">
                        {row.slateDate}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold italic text-white">{row.playerName}</span>
                        {row.teamAbbrev ? (
                          <span className="ml-2 font-mono text-[10px] uppercase text-white/25">
                            {row.teamAbbrev}
                            {row.opponent ? ` @ ${row.opponent}` : ''}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm tabular-nums text-ve-emerald">
                        {row.pregameHrScore ?? '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-sm tabular-nums text-white/50">
                        {row.pregameConfidence != null ? `${row.pregameConfidence}%` : '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] text-white/30">{row.receipt}…</td>
                      <td className="px-6 py-4">
                        <OutcomeCell row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-6 font-mono text-[9px] uppercase leading-relaxed tracking-[0.2em] text-white/20">
          Receipt = first 12 chars of the SHA-256 canonical feature hash · Outcome = official MLB
          play-by-play for that slate
        </p>
      </div>
    </section>
  );
}
