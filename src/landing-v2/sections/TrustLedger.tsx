/**
 * Aurora Trust Ledger Section
 * The transparency promise — what stays visible, always.
 * Gold is the trust accent. Copy is short, factual, verifiable.
 */
const PILLARS = [
  {
    label: 'Lineups',
    title: 'Official status, shown',
    copy: 'Confirmed lineups are marked. Projections are labeled — never sold as confirmed.',
  },
  {
    label: 'Sources',
    title: 'Evidence, not hype',
    copy: 'Every signal traces back to MLB official data and visible reasoning.',
  },
  {
    label: 'Reasoning',
    title: 'Every score explained',
    copy: 'Open any row and read why it scored the way it did.',
  },
  {
    label: 'Record',
    title: 'Results stay visible',
    copy: 'Wins and losses stay on the ledger. Nothing gets quietly deleted.',
  },
] as const;

export function TrustLedger() {
  return (
    <section className="relative bg-[var(--color-ve-graphite)] px-4 py-20">
      <div className="aurora-container max-w-5xl">
        <div className="mb-12 max-w-xl">
          <p className="font-mono mb-2 text-[11px] uppercase tracking-[0.16em] text-[var(--aurora-gold)]">
            Trust Ledger
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Built to be checked.
          </h2>
          <p className="font-ui mt-3 text-white/60">
            A record only matters if you can verify it later.
          </p>
        </div>

        <div className="aurora-stagger grid gap-px overflow-hidden rounded-xl border border-white/5 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar) => (
            <div key={pillar.label} className="aurora-fade-in bg-[var(--color-ve-obsidian)] p-6">
              <p className="font-mono mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--aurora-gold)]">
                {pillar.label}
              </p>
              <h3 className="font-display mb-2 text-base font-semibold text-white">{pillar.title}</h3>
              <p className="font-ui text-sm leading-relaxed text-white/50">{pillar.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
