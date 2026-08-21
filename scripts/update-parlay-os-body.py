import re

path = 'src/components/parlay/os/ParlayOsLayer.tsx'
with open(path, 'r') as f:
    content = f.read()

# I need to wrap the `draftLegs` mapping block with `activeTab === 'editor' ? (...) : ( <SavedParlaysView /> )`
# First, let's inject a simple `SavedParlaysView` right above `export default function ParlayOsLayer`

saved_parlays_view = """function SavedParlaysView({ savedSlips }: { savedSlips: any[] }) {
  if (savedSlips.length === 0) {
    return (
      <div className="m-3.5 flex h-[calc(100%_-_1.75rem)] min-h-[190px] flex-col items-center justify-center rounded-lg border border-dashed border-white/12 bg-black/20 px-5 py-7 text-center">
        <h3 className="text-sm font-black text-white">No Saved Parlays</h3>
        <p className="mt-2 text-[11px] leading-5 text-white/45">Build a slip in the Editor and save it here.</p>
      </div>
    );
  }

  return (
    <div className="h-full space-y-2 overflow-y-auto px-2.5 py-2.5">
      {savedSlips.map((slip) => (
        <article key={slip.publicId} className="rounded-md border border-white/10 bg-white/[0.02] p-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[11px] font-black text-white">{slip.title}</h4>
            <span className="font-mono text-[10px] text-emerald-200">{slip.oddsLabel}</span>
          </div>
          <div className="flex flex-col gap-1">
            {slip.summary && <p className="text-[9px] text-white/40">{slip.summary}</p>}
            <p className="text-[9px] text-white/30">{slip.syncedLabel}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function ParlayOsLayer"""

content = re.sub(r'export default function ParlayOsLayer', saved_parlays_view, content)

# Now for the main body:
# The `div className="relative min-h-0 flex-1"` currently contains the draftLegs logic.
body_replacement = """              <div className="relative min-h-0 flex-1">
                {activeTab === 'editor' ? (
                  <>
                    {draftLegs.length === 0 ? (
                      <div className="m-3.5 flex h-[calc(100%_-_1.75rem)] min-h-[190px] flex-col items-center justify-center rounded-lg border border-dashed border-white/12 bg-black/20 px-5 py-7 text-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-200">
                          <Plus className="h-5 w-5" />
                        </span>
                        <h3 className="mt-4 text-sm font-black text-white">Your slip is ready</h3>
                        <p className="mt-2 max-w-[260px] text-[11px] leading-5 text-white/45">
                          Add a researched player or prop. Nothing is pre-filled and nothing is simulated.
                        </p>
                        <button
                          type="button"
                          onClick={handleFindPlayers}
                          className="mt-5 min-h-10 rounded-xl border border-vouch-emerald/35 bg-vouch-emerald/10 px-4 text-[10px] font-black uppercase tracking-[0.1em] text-vouch-emerald"
                        >
                          Find HR Signals
                        </button>
                      </div>
                    ) : (
                      <>
                        <TdCorrelationWarning />
                        <div
                          ref={legListRef}
                          className="h-full space-y-1.5 overflow-y-auto overscroll-contain px-2.5 py-2.5 scroll-smooth [scrollbar-color:rgba(0,240,255,0.25)_transparent] [scrollbar-width:thin]"
                          aria-label="Current parlay legs"
                        >
                        {draftLegs.map((leg, index) => (
                          <article
                            key={leg.id}
                            data-parlay-leg-id={leg.id}
                            className={`group overflow-hidden rounded-md border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${expandedLegId === leg.id ? 'border-emerald-300/30 bg-emerald-300/[0.045] shadow-[0_8px_30px_rgba(0,0,0,0.22)]' : 'border-white/[0.085] bg-white/[0.022] hover:border-white/15 hover:bg-white/[0.035]'}`}
                          >
                            <button
                              type="button"
                              aria-expanded={expandedLegId === leg.id}
                              onClick={() => setExpandedLegId((current) => current === leg.id ? null : leg.id)}
                              className="grid min-h-[3.55rem] w-full grid-cols-[2.15rem_minmax(0,1fr)_auto_1.75rem] items-center gap-2 px-2.5 py-1.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
                            >
                              <div className="relative">
                                <PlayerHeadshot name={leg.playerName ?? leg.selection} playerId={leg.playerId} size={34} />
                                <span className="absolute -bottom-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-[#07111a] bg-emerald-300 px-1 font-mono text-[8px] font-black text-black">{index + 1}</span>
                              </div>
                              <span className="min-w-0">
                                <span className="flex items-center gap-1.5">
                                  <span className="truncate text-[11px] font-black tracking-tight text-white">{leg.playerName || leg.selection || "Selected prop"}</span>
                                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${leg.addSnapshot?.dataStatus === 'official' ? 'bg-vouch-emerald shadow-[0_0_7px_rgba(0,255,148,0.7)]' : 'bg-amber-300'}`} aria-label={leg.addSnapshot?.dataStatus ?? 'status unknown'} />
                                </span>
                                <span className="mt-0.5 block truncate text-[9px] text-white/44">
                                  {[leg.teamLabel, leg.marketLabel, leg.statTarget != null ? `${leg.comparator ?? ">="} ${leg.statTarget}` : null].filter(Boolean).join(" · ")}
                                </span>
                              </span>
                              <span className="text-right">
                                <span className="block font-mono text-[10px] font-black text-vouch-emerald">{leg.odds ?? "TBD"}</span>
                                <span className="mt-0.5 block max-w-[4.5rem] truncate text-[7px] font-bold uppercase tracking-wide text-white/28">{leg.addSnapshot?.source.replace(/_/g, ' ') ?? 'manual'}</span>
                              </span>
                              <ChevronDown className={`h-3.5 w-3.5 text-white/35 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${expandedLegId === leg.id ? 'rotate-180 text-emerald-200' : ''}`} aria-hidden="true" />
                            </button>

                            {expandedLegId === leg.id ? (
                              <div className="border-t border-white/[0.07] bg-black/15 px-3 pb-2.5 pt-2">
                                {leg.addSnapshot?.reasoningSnapshot || leg.addSnapshot?.riskSnapshot || leg.note ? (
                                  <div className="grid gap-1 text-[9px] leading-4">
                                    {leg.addSnapshot?.reasoningSnapshot ? <p className="text-white/50"><span className="font-black uppercase tracking-wide text-vouch-emerald/80">Why:</span> {leg.addSnapshot.reasoningSnapshot}</p> : null}
                                    {leg.addSnapshot?.riskSnapshot ? <p className="text-white/45"><span className="font-black uppercase tracking-wide text-amber-200/80">Risk:</span> {leg.addSnapshot.riskSnapshot}</p> : null}
                                    {leg.note ? <p className="text-white/45"><span className="font-black uppercase tracking-wide text-emerald-100/75">Note:</span> {leg.note}</p> : null}
                                  </div>
                                ) : <p className="text-[9px] leading-4 text-white/35">No additional decision notes were captured for this leg.</p>}
                                <div className="mt-2 grid grid-cols-2 gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openLegEditor(leg.id)}
                                    className="flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-emerald-300/15 bg-emerald-300/[0.04] text-[8px] font-black uppercase tracking-wide text-emerald-100/70 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.98]"
                                  >
                                    <Pencil className="h-3 w-3" /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      removeDraftLeg(leg.id);
                                      setExpandedLegId(null);
                                    }}
                                    className="flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-white/10 text-[8px] font-black uppercase tracking-wide text-white/40 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.98] hover:border-rose-300/25 hover:text-rose-200"
                                  >
                                    <Trash2 className="h-3 w-3" /> Remove
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </article>
                        ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <SavedParlaysView savedSlips={savedSlips} />
                )}
                {activeTab === 'editor' && draftLegs.length > 0 ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#03080e] to-transparent" aria-hidden="true" />
                ) : null}
              </div>

              <footer className="shrink-0 border-t border-white/10 bg-[#03080e]/95 px-3 py-2.5 shadow-[0_-12px_35px_rgba(0,0,0,0.28)]">
                {activeTab === 'editor' ? (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/38">Combined odds</span>
                      <span className="font-mono text-sm font-black text-emerald-200">{combinedOdds}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {draftLegs.length >= 2 ? (
                        <button
                          type="button"
                          onClick={handleSaveParlay}
                          className="min-h-10 rounded-md border border-emerald-400 bg-emerald-500/20 text-[9px] font-black uppercase tracking-[0.09em] text-emerald-100 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.98]"
                        >
                          Save Parlay
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleFindPlayers}
                          className="min-h-10 rounded-md border border-white/12 bg-white/[0.025] text-[9px] font-black uppercase tracking-[0.09em] text-white/65 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.98]"
                        >
                          Add Players
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleOpenHub}
                        className="flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-emerald-300/35 bg-emerald-300/12 text-[9px] font-black uppercase tracking-[0.09em] text-emerald-100 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.98]"
                      >
                        Full Workspace <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setActiveTab('editor')}
                      className="min-h-10 w-full rounded-md border border-white/12 bg-white/[0.025] text-[9px] font-black uppercase tracking-[0.09em] text-white/65 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[0.98]"
                    >
                      Back to Editor
                    </button>
                  </div>
                )}
              </footer>"""

# The regex replaces from `<div className="relative min-h-0 flex-1">` all the way to `</footer>`
content = re.sub(r'<div className="relative min-h-0 flex-1">[\s\S]*?</footer>', body_replacement, content)

with open(path, 'w') as f:
    f.write(content)
