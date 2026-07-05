import type { HrWatchRow } from '../../types/hrWatch';

interface HrPlayerDrawerProps {
  row: HrWatchRow | null;
  onClose: () => void;
}

const sections = [
  'Overview',
  'AI',
  'Weather',
  'Pitch Mix',
  'History',
  'Research',
] as const;

export function HrPlayerDrawer({ row, onClose }: HrPlayerDrawerProps) {
  if (!row) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#091121]/95 px-6 py-6 shadow-[0_0_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:w-[520px]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{row.team} · {row.opponent}</p>
          <h2 className="mt-2 text-3xl font-black text-slate-100">{row.playerName}</h2>
          <p className="mt-1 text-sm text-slate-400">{row.pitcherName} · {row.venue}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200">Close</button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {sections.map((section) => (
          <span key={section} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{section}</span>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">AI Summary</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">{row.reasons.length > 0 ? row.reasons[0] : 'No summary available.'}</p>
        </section>

        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Reasons</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            {row.reasons.length > 0 ? row.reasons.map((reason) => (
              <p key={reason} className="rounded-2xl border border-white/10 bg-[#0B1020]/80 px-3 py-2">• {reason}</p>
            )) : <p>No reasons available.</p>}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Pitch Mix</h3>
            <p className="mt-3 text-sm text-slate-300">Top matchup data and pitch mix signals are available in the full model.</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Weather</h3>
            <p className="mt-3 text-sm text-slate-300">Wind and park lift are evaluated here for every row.</p>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Research Notes</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">Open the card to see the full player insights and build stronger conviction.</p>
        </section>
      </div>
    </div>
  );
}
