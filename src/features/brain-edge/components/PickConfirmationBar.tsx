import type { PickInput } from "../contracts/pick";

type Props = {
  pick: PickInput | null;
};

export default function PickConfirmationBar({ pick }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#0b1220] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Pick Confirmation
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {pick ? pick.playerName : "Select a Pick"}
          </h2>

          <p className="mt-2 text-sm text-white/60">
            {pick
              ? `${pick.market} • ${pick.selection.toUpperCase()} ${pick.line ?? "-"}`
              : "Choose a player to begin analysis."}
          </p>
        </div>

        <button
          disabled={!pick}
          className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          Analyze Pick
        </button>
      </div>
    </section>
  );
}
