/**
 * Legacy decorative HUD retained for archive/review imports.
 * The production landing no longer mounts this component because it previously
 * displayed unverified confidence scores, datapoint counts, and "live" refresh
 * claims. Use `ResearchPreviewSection` for truthful research previews instead.
 */
export default function LiveHud() {
  return (
    <div className="rounded-[28px] border border-amber-300/30 bg-[#060c16]/90 p-6 text-left">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200">
        Demo research view — sample data
      </p>
      <p className="mt-3 text-sm leading-6 text-white/65">
        This legacy console is not shown on the public landing page. Open the research preview
        section for schedule-backed matchup context without fabricated live metrics.
      </p>
    </div>
  );
}
