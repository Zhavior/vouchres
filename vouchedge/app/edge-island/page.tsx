import { AppShell } from "@/components/layout/AppShell";
import { EdgeTerminal } from "@/components/edge/EdgeTerminal";
import { PageHero } from "@/components/ui/PageHero";

export default function EdgeIslandPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="Edge Island"
        title="The premium MLB command center."
        subtitle="Monitor HR candidates, pitcher edges, market signal, and live confidence from one unified terminal."
      />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <EdgeTerminal />
      </section>
    </AppShell>
  );
}
