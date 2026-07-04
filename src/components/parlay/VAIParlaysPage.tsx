type VAIParlaysPageProps = {
  savedSlips: any[];
  onSectionChange?: (section: string) => void;
};

function normalizeStatus(value: unknown): string {
  return String(value ?? "pending").toLowerCase();
}

function isVaiSlip(slip: any): boolean {
  const metadata = slip?.metadata ?? {};
  const source = String(slip?.source ?? metadata?.source ?? "").toLowerCase();

  return (
    slip?.aiGenerated === true ||
    slip?.ai_generated === true ||
    metadata?.aiGenerated === true ||
    metadata?.ai_generated === true ||
    source === "ai_pick" ||
    source === "vai" ||
    source === "vai_locked" ||
    source === "vouch_ai"
  );
}

function getSlipStatus(slip: any): "open" | "live" | "won" | "lost" | "voided" {
  const status = normalizeStatus(slip?.status ?? slip?.result ?? slip?.gradingStatus);

  if (["won", "win", "graded_won"].includes(status)) return "won";
  if (["lost", "loss", "graded_lost"].includes(status)) return "lost";
  if (["void", "voided", "push", "pushed", "no_action", "no-action"].includes(status)) return "voided";
  if (["live", "active", "in_progress", "in-progress"].includes(status)) return "live";

  return "open";
}

function getSlipTitle(slip: any): string {
  return (
    slip?.title ||
    slip?.name ||
    slip?.metadata?.title ||
    slip?.metadata?.summary ||
    "Locked V.A.I Research Slip"
  );
}

function getSlipSummary(slip: any): string {
  const legs = Array.isArray(slip?.legs) ? slip.legs : Array.isArray(slip?.pick_legs) ? slip.pick_legs : [];
  if (typeof slip?.summary === "string" && slip.summary.trim()) return slip.summary;
  if (typeof slip?.metadata?.summary === "string" && slip.metadata.summary.trim()) return slip.metadata.summary;

  return legs
    .slice(0, 4)
    .map((leg: any) => leg?.playerName || leg?.player_name || leg?.selection || leg?.marketLabel || leg?.market || "Research leg")
    .join(" · ");
}

function BucketCard({
  title,
  count,
  tone,
  slips,
}: {
  title: string;
  count: number;
  tone: string;
  slips: any[];
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">{tone}</p>
          <h3 className="mt-1 text-xl font-black text-white">{title}</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-lg font-black text-white">
          {count}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {slips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-500">
            No V.A.I slips in this bucket yet.
          </div>
        ) : (
          slips.slice(0, 6).map((slip) => (
            <article key={slip.id ?? `${title}-${getSlipTitle(slip)}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-black text-white">{getSlipTitle(slip)}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{getSlipSummary(slip) || "Awaiting V.A.I leg summary."}</p>
                </div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                  V.A.I
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default function VAIParlaysPage({ savedSlips, onSectionChange }: VAIParlaysPageProps) {
  const vaiSlips = savedSlips.filter(isVaiSlip);
  const buckets = {
    open: vaiSlips.filter((slip) => getSlipStatus(slip) === "open"),
    live: vaiSlips.filter((slip) => getSlipStatus(slip) === "live"),
    won: vaiSlips.filter((slip) => getSlipStatus(slip) === "won"),
    lost: vaiSlips.filter((slip) => getSlipStatus(slip) === "lost"),
    voided: vaiSlips.filter((slip) => getSlipStatus(slip) === "voided"),
  };

  const settled = buckets.won.length + buckets.lost.length;
  const winRate = settled > 0 ? Math.round((buckets.won.length / settled) * 100) : 0;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[2.5rem] border border-cyan-300/15 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 shadow-2xl shadow-cyan-950/20">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-200/80">Vouch Artificial Intelligence</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">V.A.I Parlays Ledger</h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                Locked AI-made research slips live here, separate from manual user parlays. This protects V.A.I win/loss truth,
                model performance, subscriber trust, and future profile analytics.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="text-2xl font-black text-white">{vaiSlips.length}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">AI Slips</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="text-2xl font-black text-white">{winRate}%</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">W/L Rate</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="text-2xl font-black text-white">{buckets.live.length}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Live</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-xs leading-relaxed text-amber-50/90">
            <span className="font-black text-amber-100">Responsible Research:</span> V.A.I parlays are research outputs only,
            not betting advice, financial advice, or guaranteed outcomes. Users remain responsible for their own decisions.
          </div>

          {onSectionChange ? (
            <button
              type="button"
              onClick={() => onSectionChange("ai_engine")}
              className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-300/15"
            >
              Generate More V.A.I Research
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <BucketCard title="Open" tone="Awaiting start" count={buckets.open.length} slips={buckets.open} />
          <BucketCard title="Live" tone="In progress" count={buckets.live.length} slips={buckets.live} />
          <BucketCard title="Won" tone="Verified wins" count={buckets.won.length} slips={buckets.won} />
          <BucketCard title="Lost" tone="Verified losses" count={buckets.lost.length} slips={buckets.lost} />
        </div>

        <BucketCard title="Voided / Pushed" tone="Truth context" count={buckets.voided.length} slips={buckets.voided} />
      </section>
    </main>
  );
}
