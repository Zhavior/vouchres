import { AppShell } from "@/components/layout/AppShell";
import { EdgeTerminal } from "@/components/edge/EdgeTerminal";

export default function HrTodayPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10">
          <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
            HR Today
          </div>
          <h1 className="mt-4 text-5xl font-black uppercase tracking-tight">
            Home Run Board
          </h1>
          <p className="mt-4 max-w-2xl text-white/55">
            Today’s live HR candidates, pitcher matchups, confidence scores, and lines.
          </p>
        </div>

        <EdgeTerminal />
      </section>
    </AppShell>
  );
}
