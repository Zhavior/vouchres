import type { IntelligenceConsoleProps } from "./types";

import Hero from "./Hero";
import Metrics from "./Metrics";
import Verdict from "./Verdict";
import Evidence from "./Evidence";
import Matchup from "./Matchup";
import Timeline from "./Timeline";
import Footer from "./Footer";

export default function IntelligenceConsole<TPlayer extends Record<string, unknown>>({
  player,
  analysis,
}: IntelligenceConsoleProps<TPlayer>) {
  return (
    <section className="space-y-6">
      <Hero player={player} analysis={analysis} />

      <Metrics analysis={analysis} />

      <Verdict analysis={analysis} />

      <Evidence evidence={analysis.evidence} />

      <Matchup analysis={analysis} />

      <Timeline />

      <Footer />
    </section>
  );
}
