import { Surface } from "@/aurora";
import LandingLiveGamesCenter from "@/components/landing/LandingLiveGamesCenter";

export default function LiveGamesSection() {
  return (
    <section className="py-20">
      <Surface elevation="raised" className="p-8">
        <LandingLiveGamesCenter />
      </Surface>
    </section>
  );
}
