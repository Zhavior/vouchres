import type { IntelligenceEvidence } from "./types";

interface EvidenceProps {
  evidence: IntelligenceEvidence[];
}

function color(strength: IntelligenceEvidence["strength"]) {
  switch (strength) {
    case "positive":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";

    case "negative":
      return "border-red-500/25 bg-red-500/10 text-red-300";

    default:
      return "border-amber-500/25 bg-amber-500/10 text-amber-300";
  }
}

function icon(strength: IntelligenceEvidence["strength"]) {
  switch (strength) {
    case "positive":
      return "✓";

    case "negative":
      return "✕";

    default:
      return "•";
  }
}

export default function Evidence({
  evidence,
}: EvidenceProps) {
  if (!evidence.length) {
    return (
      <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.30em] text-white/50">
          Evidence
        </h3>

        <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">
          No evidence available.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6">

      <h3 className="text-xs font-semibold uppercase tracking-[0.30em] text-white/50">
        Evidence
      </h3>

      <div className="mt-6 space-y-3">

        {evidence.map(item => (
          <div
            key={item.id}
            className={`rounded-2xl border p-4 ${color(item.strength)}`}
          >
            <div className="flex items-start gap-3">

              <div className="text-lg font-bold">
                {icon(item.strength)}
              </div>

              <div className="min-w-0">

                <div className="font-semibold">
                  {item.title}
                </div>

                {item.description && (
                  <div className="mt-1 text-sm opacity-80">
                    {item.description}
                  </div>
                )}

              </div>

            </div>
          </div>
        ))}

      </div>

    </section>
  );
}
