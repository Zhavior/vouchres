interface FooterProps {
  onResearch?: () => void;
  onAddToParlay?: () => void;
  onCompare?: () => void;
  onShare?: () => void;
}

function ActionButton({
  label,
  onClick,
  variant = "secondary",
}: {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "bg-cyan-500 text-black hover:bg-cyan-400"
      : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${styles}`}
    >
      {label}
    </button>
  );
}

export default function Footer({
  onResearch,
  onAddToParlay,
  onCompare,
  onShare,
}: FooterProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6">

      <div className="text-xs font-semibold uppercase tracking-[0.30em] text-white/45">
        Actions
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

        <ActionButton
          label="Research"
          onClick={onResearch}
        />

        <ActionButton
          label="Add to Parlay"
          variant="primary"
          onClick={onAddToParlay}
        />

        <ActionButton
          label="Compare"
          onClick={onCompare}
        />

        <ActionButton
          label="Share"
          onClick={onShare}
        />

      </div>

    </section>
  );
}
