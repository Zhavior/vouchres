import React from 'react';
import { motion } from 'motion/react';
import { Check, Shield, Crown } from 'lucide-react';

const TIERS = [
  {
    name: "Standard_Operator",
    price: "99",
    desc: "Essential neural tools for the disciplined trader.",
    features: ["Live HR Watch Feed", "Basic Pitcher Matrix", "Standard Market Depth", "Neural Search Access"],
    icon: Shield,
    color: "text-white/60"
  },
  {
    name: "Alpha_Lead",
    price: "249",
    desc: "Full system override. Maximum data transparency.",
    features: ["Real-time Live Radar", "Advanced Neural Heatmaps", "Smart Money Flow Tracking", "Priority Node Latency", "Voice Command Suite"],
    icon: Crown,
    color: "text-ve-emerald",
    popular: true
  }
];

export default function AccessTiers() {
  return (
    <section className="py-40 px-6 bg-black/20">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter italic text-white mb-4 uppercase">System_Access_Tiers</h2>
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Select your clearance level to initialize connection.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className={`relative bg-[#0A0A0A]/40 backdrop-blur-xl p-10 border border-white/5 flex flex-col ${
                tier.popular ? "border-ve-emerald/20 ring-1 ring-ve-emerald/10" : ""
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-ve-emerald text-black text-[8px] font-bold uppercase tracking-[0.2em]">
                  Recommended_Clearance
                </div>
              )}

              <div className="flex justify-between items-start mb-8">
                <div>
                  <tier.icon className={`mb-4 ${tier.color}`} size={28} />
                  <h3 className="text-xl font-bold tracking-tight italic text-white uppercase">{tier.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-white">${tier.price}</span>
                  <span className="text-[10px] font-mono text-white/20 block uppercase">/ Monthly</span>
                </div>
              </div>

              <p className="text-sm text-white/40 mb-8 leading-relaxed">{tier.desc}</p>

              <ul className="space-y-4 mb-10 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-white/60">
                    <Check size={12} className="text-ve-emerald" />
                    {f}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-4 font-bold uppercase tracking-[0.2em] text-[10px] transition-all ${
                tier.popular 
                  ? "bg-ve-emerald text-black hover:bg-white" 
                  : "bg-white/5 text-white border border-white/10 hover:bg-white/10"
              }`}>
                Request_Clearance
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
