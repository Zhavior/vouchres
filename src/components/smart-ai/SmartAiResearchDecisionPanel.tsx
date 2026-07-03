interface SmartAiResearchDecisionPanelProps {
  researchSignals: {
    researchGrade: string;
    confidenceBand: string;
    dataCompleteness: number;
    evidenceScore: number;
    marketValueScore: number;
    volatilityScore: number;
    whyThisPick: string[];
    whatCouldGoWrong: string[];
    warningFlags: string[];
    roleFit: string[];
  };
}

export function SmartAiResearchDecisionPanel({ researchSignals }: SmartAiResearchDecisionPanelProps) {
  return (
    <>
{/* Researcher Decision Signals */}
<div className="rounded-3xl border border-violet-300/15 bg-violet-400/[0.04] p-4 shadow-lg shadow-violet-950/10">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <span className="block text-[9px] font-mono text-violet-300 uppercase tracking-[0.22em] leading-none font-black">
        Research Decision Layer
      </span>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-2.5 py-1 text-[10px] font-mono font-black text-violet-200">
          Grade {researchSignals.researchGrade}
        </span>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-mono font-black text-cyan-200">
          {researchSignals.confidenceBand} confidence
        </span>
        <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-mono font-black text-amber-200">
          {researchSignals.dataCompleteness}% data complete
        </span>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2 text-right">
      <div>
        <span className="block text-[9px] font-mono uppercase tracking-[0.18em] text-slate-500">Evidence</span>
        <span className="text-sm font-black text-white">{researchSignals.evidenceScore}</span>
      </div>
      <div>
        <span className="block text-[9px] font-mono uppercase tracking-[0.18em] text-slate-500">Market</span>
        <span className="text-sm font-black text-white">{researchSignals.marketValueScore}</span>
      </div>
      <div>
        <span className="block text-[9px] font-mono uppercase tracking-[0.18em] text-slate-500">Volatility</span>
        <span className="text-sm font-black text-white">{researchSignals.volatilityScore}</span>
      </div>
    </div>
  </div>

  <div className="mt-4 grid gap-3 lg:grid-cols-3">
    <div className="rounded-2xl border border-emerald-300/10 bg-emerald-400/5 p-3">
      <span className="block text-[9px] font-mono font-black uppercase tracking-[0.2em] text-emerald-300">
        Why this pick
      </span>
      <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-slate-300">
        {researchSignals.whyThisPick.map((item) => (
          <li key={item}>✓ {item}</li>
        ))}
      </ul>
    </div>

    <div className="rounded-2xl border border-rose-300/10 bg-rose-400/5 p-3">
      <span className="block text-[9px] font-mono font-black uppercase tracking-[0.2em] text-rose-300">
        What could go wrong
      </span>
      <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-slate-300">
        {researchSignals.whatCouldGoWrong.map((item) => (
          <li key={item}>⚠ {item}</li>
        ))}
      </ul>
    </div>

    <div className="rounded-2xl border border-amber-300/10 bg-amber-400/5 p-3">
      <span className="block text-[9px] font-mono font-black uppercase tracking-[0.2em] text-amber-300">
        Research warnings
      </span>
      <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-slate-300">
        {researchSignals.warningFlags.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {researchSignals.roleFit.map((role) => (
          <span
            key={role}
            className="rounded-full border border-slate-700 bg-slate-950/60 px-2 py-0.5 text-[9px] font-mono font-black uppercase text-slate-400"
          >
            {role}
          </span>
        ))}
      </div>
    </div>
  </div>
</div>
    </>
  );
}
