import { AppShell } from "@/components/layout/AppShell";
import { PageHero } from "@/components/ui/PageHero";
import { GlassCard } from "@/components/ui/GlassCard";

const plans = [
  { name: "Free", price: "$0", text: "Basic market preview and public ledger access." },
  { name: "Pro", price: "$29", text: "Live Edge Island terminal, HR board, and model confidence." },
  { name: "Capper", price: "$99", text: "Advanced tools, profile monetization, and premium analytics." },
];

export default function PricingPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="Pricing"
        title="Choose your edge."
        subtitle="Start free, upgrade when you are ready for the full VouchEdge terminal."
      />
      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-24 md:grid-cols-3">
        {plans.map((plan) => (
          <GlassCard key={plan.name} className="p-8">
            <h2 className="text-2xl font-black uppercase">{plan.name}</h2>
            <div className="mt-6 text-5xl font-black text-cyan-300">{plan.price}</div>
            <p className="mt-6 leading-7 text-white/50">{plan.text}</p>
            <button className="mt-8 w-full rounded-2xl bg-cyan-300 px-6 py-4 text-sm font-black uppercase tracking-widest text-black">
              Select Plan
            </button>
          </GlassCard>
        ))}
      </section>
    </AppShell>
  );
}
