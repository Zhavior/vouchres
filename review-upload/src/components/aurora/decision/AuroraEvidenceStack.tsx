import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AuroraEvidenceStackProps {
  reasons: string[];
  risks: string[];
}

export function AuroraEvidenceStack({ reasons, risks }: AuroraEvidenceStackProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section aria-labelledby="aurora-reasons-title">
        <h3 id="aurora-reasons-title" className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
          Why
        </h3>
        {reasons.length ? (
          <ul className="mt-3 space-y-2">
            {reasons.map((reason) => (
              <li key={reason} className="flex gap-3 text-sm leading-6 text-white/75">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-vouch-cyan" aria-hidden="true" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-white/50">No model rationale was supplied.</p>
        )}
      </section>

      <section aria-labelledby="aurora-risks-title">
        <h3 id="aurora-risks-title" className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
          Watch before acting
        </h3>
        {risks.length ? (
          <ul className="mt-3 space-y-2">
            {risks.map((risk) => (
              <li key={risk} className="flex gap-3 text-sm leading-6 text-white/75">
                <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-vouch-amber" aria-hidden="true" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-white/50">No specific risk note was supplied.</p>
        )}
      </section>
    </div>
  );
}
