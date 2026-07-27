import { Surface } from "@/aurora";
import LandingJudgesDeck from "@/components/landing/LandingJudgesDeck";

export default function TrustSection() {
  return (
    <section className="py-20">
      <Surface elevation="raised" className="p-8">
        <LandingJudgesDeck />
      </Surface>
    </section>
  );
}
