import { ArrowDown, Database } from 'lucide-react';
import { AURORA_LABEL, AURORA_PANEL } from '../../../theme/auroraTokens';
import { AuroraEvidenceStack } from './AuroraEvidenceStack';
import { AuroraTrustState } from './AuroraTrustState';
import type { AuroraDecisionPresentation } from './types';

interface AuroraDecisionSurfaceProps {
  decision: AuroraDecisionPresentation;
  deepResearchId?: string;
}

export function AuroraDecisionSurface({ decision, deepResearchId }: AuroraDecisionSurfaceProps) {
  const matchup = [decision.player.team, decision.player.opponent ? `vs ${decision.player.opponent}` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={`${AURORA_PANEL} overflow-hidden p-0`} aria-labelledby="aurora-decision-title">
      <div className="grid min-w-0 gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            {decision.player.headshot ? (
              <img
                src={decision.player.headshot}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg border border-white/10 bg-black/30 object-cover sm:h-16 sm:w-16"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-lg font-black text-white/35 sm:h-16 sm:w-16" aria-hidden="true">
                {decision.player.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className={`${AURORA_LABEL} text-vouch-cyan`}>{decision.answer.eyebrow}</p>
              <h2 id="aurora-decision-title" className="mt-1 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
                {decision.player.name}
              </h2>
              <p className="mt-1 truncate text-sm text-white/50">
                {matchup || 'Matchup unavailable'}{decision.player.pitcher ? ` · ${decision.player.pitcher}` : ''}
              </p>
            </div>
          </div>

          <div className="mt-5 border-l-2 border-vouch-cyan pl-4">
            <h3 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">{decision.answer.title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">{decision.answer.summary}</p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-px bg-white/10 sm:max-w-md">
            <div className="bg-black/60 p-3">
              <div className={`${AURORA_LABEL} text-white/35`}>Model score</div>
              <div className="mt-1 font-mono text-xl font-black tabular-nums text-white">{decision.answer.score ?? '—'}</div>
            </div>
            <div className="bg-black/60 p-3">
              <div className={`${AURORA_LABEL} text-white/35`}>Data confidence</div>
              <div className="mt-1 font-mono text-xl font-black tabular-nums text-white">
                {decision.answer.confidence === null ? '—' : `${decision.answer.confidence}%`}
              </div>
            </div>
          </div>
        </div>

        <AuroraTrustState trust={decision.trust} />
      </div>

      <div className="border-t border-white/10 p-4 sm:p-6">
        <AuroraEvidenceStack reasons={decision.reasons} risks={decision.risks} />
      </div>

      <div className="border-t border-white/10 p-4 sm:p-6">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {decision.evidence.map((item) => (
            <div key={item.id} className="min-w-0 border border-white/10 bg-black/30 p-3">
              <div className={`${AURORA_LABEL} truncate text-white/35`}>{item.label}</div>
              <div className="mt-2 font-mono text-lg font-black tabular-nums text-white">{item.value ?? 'Unavailable'}</div>
              <p className="mt-1 text-xs leading-5 text-white/40">{item.detail}</p>
            </div>
          ))}
        </div>

        {deepResearchId ? (
          <a
            href={`#${deepResearchId}`}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-vouch-cyan px-4 py-3 text-sm font-black text-black transition-colors hover:bg-vouch-cyan/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vouch-cyan/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-auto"
            onClick={() => {
              const disclosure = document.getElementById(deepResearchId);
              if (disclosure instanceof HTMLDetailsElement) disclosure.open = true;
            }}
          >
            {decision.answer.actionLabel}
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
        ) : null}

        {!decision.trust.source ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-white/40">
            <Database className="h-3.5 w-3.5" aria-hidden="true" />
            A source label was not included in the current payload.
          </p>
        ) : null}
      </div>
    </article>
  );
}
