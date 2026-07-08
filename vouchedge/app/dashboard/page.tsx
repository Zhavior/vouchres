import { AppShell } from "@/components/layout/AppShell";
import { EdgeTerminal } from "@/components/edge/EdgeTerminal";
import { PageHero } from "@/components/ui/PageHero";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="Dashboard"
        title="Your betting intelligence home."
        subtitle="Track your edge, monitor live data, and jump into Edge Island."
      />
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <EdgeTerminal />
      </section>
    </AppShell>
  );
}
