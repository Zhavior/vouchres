import {
  Z8_EMERALD,
  Z8_LABEL,
  Z8_PANEL_PREMIUM,
  Z8_STAT_CHIP,
  Z8_TABULAR,
  Z8_WARNING,
} from '../../theme/z8Tokens';

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
    <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className={`${Z8_LABEL} text-vouch-cyan`}>Research decision layer</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`${Z8_LABEL} rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-white/70`}>
              Grade {researchSignals.researchGrade}
            </span>
            <span className={`${Z8_LABEL} rounded-full border border-vouch-cyan/25 bg-vouch-cyan/10 px-2.5 py-1 text-vouch-cyan`}>
              {researchSignals.confidenceBand}
            </span>
            <span className={`${Z8_LABEL} rounded-full border border-vouch-amber/25 bg-vouch-amber/10 px-2.5 py-1 ${Z8_WARNING}`}>
              {researchSignals.dataCompleteness}% data
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-right">
          {[
            ['Evidence', researchSignals.evidenceScore],
            ['Market', researchSignals.marketValueScore],
            ['Volatility', researchSignals.volatilityScore],
          ].map(([label, value]) => (
            <div key={label} className={Z8_STAT_CHIP}>
              <span className={`${Z8_LABEL} text-white/35`}>{label}</span>
              <span className={`mt-0.5 block text-sm font-black text-white ${Z8_TABULAR}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className={`${Z8_STAT_CHIP} border-vouch-emerald/15`}>
          <span className={`${Z8_LABEL} ${Z8_EMERALD}`}>Why this pick</span>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-white/55">
            {researchSignals.whyThisPick.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </div>

        <div className={`${Z8_STAT_CHIP} border-red-400/15`}>
          <span className={`${Z8_LABEL} text-red-300`}>What could go wrong</span>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-white/55">
            {researchSignals.whatCouldGoWrong.map((item) => (
              <li key={item}>⚠ {item}</li>
            ))}
          </ul>
        </div>

        <div className={`${Z8_STAT_CHIP} border-vouch-amber/15`}>
          <span className={`${Z8_LABEL} ${Z8_WARNING}`}>Research warnings</span>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-white/55">
            {researchSignals.warningFlags.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {researchSignals.roleFit.map((role) => (
              <span
                key={role}
                className={`${Z8_LABEL} rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-white/45`}
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
