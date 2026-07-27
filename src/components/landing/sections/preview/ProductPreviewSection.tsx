import { Surface } from "@/aurora";
import LandingDeviceShowcase from "@/components/landing/LandingDeviceShowcase";
import LandingVouchCardShowcase from "@/components/landing/LandingVouchCardShowcase";

export default function ProductPreviewSection() {
  return (
    <section className="py-20">
      <Surface elevation="raised" className="p-8 space-y-8">
        <LandingDeviceShowcase />
        <LandingVouchCardShowcase />
      </Surface>
    </section>
  );
}
