import React from 'react';
import type { HrWatchRow } from '../../hr/types/hrWatch';
import { assessVerifiedNow, VERIFIED_NOW_LABELS } from '../utils/verifiedNow';

const score = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
    ? value : null;

/** Park factor is a venue index, not a substitute for a 0–100 model layer. */
export function HrNextCollisionField({ row }: { row: HrWatchRow }) {
  const assessment = assessVerifiedNow(row);
  const layers = [
    {
      name: 'Hitter power', value: score(row.hitterPower),
      explanation: 'The model’s assessment of the hitter’s power profile. Higher means a stronger power signal.',
      color: '#31B583',
    },
    {
      name: 'Pitcher vulnerability', value: score(row.pitcherVulnerability),
      explanation: 'How vulnerable the opposing pitcher looks in the model. Higher favors the hitter.',
      color: '#4FB8DC',
    },
    {
      name: 'Park context', value: score(row.parkContext),
      explanation: 'The model’s park-context score. This does not confirm that weather data is available.',
      color: '#E4BB78',
    },
  ];
  const blocked = row.riskTier === 'Blocked' || row.truthStatus === 'blocked';

  return (
    <section aria-label="Player evidence breakdown" className="border-t border-white/10 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">What drives this player’s score?</h3>
        <span className="text-xs text-white/60">Model layers · 0–100 · not HR probability</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          {layers.map((layer) => (
            <details key={layer.name} className="border border-white/10 bg-white/[0.02] p-3">
              <summary className="cursor-pointer text-sm text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ve-emerald">
                {layer.name}
                <span className="float-right ml-2 font-mono tabular-nums" style={{ color: layer.color }}>
                  {layer.value == null ? 'Unavailable' : `${Math.round(layer.value)}/100`}
                </span>
              </summary>
              <div className="mt-3 h-1.5 overflow-hidden bg-white/10" aria-hidden="true">
                <div className="h-full" style={{ width: `${layer.value ?? 0}%`, backgroundColor: layer.color }} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/65">{layer.explanation}</p>
            </details>
          ))}
        </div>
        <div className="min-w-0 border-l-2 border-ve-amber/50 pl-4">
          <h4 className="text-sm font-semibold text-white">
            {blocked ? 'Candidate blocked' : assessment.verified ? 'Required inputs available' : 'Research still incomplete'}
          </h4>
          <p className="mt-2 text-xs leading-relaxed text-white/65">
            {assessment.missing.length > 0
              ? 'These missing inputs need review before this candidate can pass the source-completeness check.'
              : 'Source completeness describes the available evidence. It does not guarantee a home run.'}
          </p>
          {assessment.missing.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Missing research inputs">
              {assessment.missing.map((key) => (
                <li key={key} className="border border-ve-amber/25 bg-ve-amber/5 px-2 py-1 text-xs text-ve-amber">
                  {VERIFIED_NOW_LABELS[key]}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs leading-relaxed text-white/55">
            Open Dossier above to inspect the player’s research. Expand a layer to understand its score.
          </p>
        </div>
      </div>
    </section>
  );
}

export default HrNextCollisionField;
