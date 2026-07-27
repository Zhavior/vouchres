interface TimelineStep {
  label: string;
  complete: boolean;
}

interface TimelineProps {
  steps?: TimelineStep[];
}

const DEFAULT_STEPS: TimelineStep[] = [
  { label: "Research", complete: true },
  { label: "Validation", complete: true },
  { label: "Weather", complete: true },
  { label: "Lineup", complete: true },
  { label: "Decision", complete: true },
];

export default function Timeline({
  steps = DEFAULT_STEPS,
}: TimelineProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6">

      <div className="text-xs font-semibold uppercase tracking-[0.30em] text-white/45">
        Intelligence Timeline
      </div>

      <div className="mt-8">

        {steps.map((step, index) => (
          <div
            key={step.label}
            className="flex items-start gap-4"
          >

            <div className="flex flex-col items-center">

              <div
                className={
                  step.complete
                    ? "flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-black"
                    : "flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/40"
                }
              >
                {step.complete ? "✓" : index + 1}
              </div>

              {index !== steps.length - 1 && (
                <div className="my-2 h-8 w-px bg-white/10" />
              )}

            </div>

            <div className="pb-6">

              <div className="font-semibold text-white">
                {step.label}
              </div>

              <div className="mt-1 text-sm text-white/50">
                {step.complete
                  ? "Completed"
                  : "Pending"}
              </div>

            </div>

          </div>
        ))}

      </div>

    </section>
  );
}
