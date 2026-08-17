type Props = {
  confidence?: number | null;
  edge?: number | null;
};

function value(v?: number | null) {
  return v == null ? "—" : `${v}%`;
}

export default function HeroSignals({
  confidence,
  edge,
}: Props) {
  return (
    <section className="grid grid-cols-2 gap-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">
          Confidence
        </div>
        <div className="mt-2 text-2xl font-bold text-white">
          {value(confidence)}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="text-xs uppercase tracking-[0.25em] text-zinc-500">
          Edge
        </div>
        <div className="mt-2 text-2xl font-bold text-emerald-400">
          {value(edge)}
        </div>
      </div>
    </section>
  );
}
