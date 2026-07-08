"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HomeData = {
  hero: {
    gamesTonight: number | null;
    confidence: number | null;
    lastUpdated: string;
  };
  pulse: string[];
  featuredVouches: {
    id: string;
    player: string;
    team: string;
    pitcher: string;
    confidence: number;
    line: string;
  }[];
  stats: {
    games: number;
    candidates: number;
  };
};

export default function LandingPage() {
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/home", { cache: "no-store" });
      setData(await res.json());
    }

    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,.25),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,.16),transparent_28%),linear-gradient(180deg,#020617,#000,#020617)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="text-3xl font-black italic">
            Vouch<span className="text-cyan-300">Edge</span>
          </div>
          <Link href="/login" className="rounded-full border border-cyan-300/40 px-5 py-2 text-xs font-black uppercase tracking-widest text-cyan-300">
            Login
          </Link>
        </nav>

        <div className="grid min-h-[82vh] items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="mb-6 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-300">
              Live MLB Intelligence
            </div>

            <h1 className="text-6xl font-black uppercase leading-[0.86] tracking-tighter md:text-8xl">
              The edge before
              <span className="block text-cyan-300">the market moves.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-white/60">
              VouchEdge combines AI confidence, live MLB signal, and community conviction into one command center.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/edge-island" className="rounded-2xl bg-cyan-300 px-8 py-4 text-sm font-black uppercase tracking-widest text-black hover:bg-white">
                Enter Edge Island
              </Link>
              <Link href="/pricing" className="rounded-2xl border border-white/15 bg-white/[0.04] px-8 py-4 text-sm font-black uppercase tracking-widest text-white/70">
                View Plans
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl shadow-2xl">
            <div className="mb-6 text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              The Pulse
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <Stat label="Games" value={String(data?.stats.games ?? 0)} />
              <Stat label="Candidates" value={String(data?.stats.candidates ?? 0)} />
              <Stat label="AI Edge" value={`${data?.hero.confidence ?? 0}%`} />
            </div>

            <div className="space-y-3 mb-8">
              {(data?.pulse ?? []).map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white/70">
                  ⚡ {item}
                </div>
              ))}
            </div>

            <div className="text-xs font-black uppercase tracking-[0.3em] text-white/35 mb-4">
              Most Vouched Tonight
            </div>

            <div className="space-y-3">
              {(data?.featuredVouches ?? []).map((pick) => (
                <div key={pick.id} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xl font-black">{pick.player}</div>
                      <div className="text-sm text-white/45">{pick.team} vs {pick.pitcher}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-cyan-300 font-black">{pick.line}</div>
                      <div className="text-emerald-300 text-sm">{pick.confidence}% AI</div>
                    </div>
                  </div>
                  <button className="mt-4 w-full rounded-xl bg-cyan-300 py-3 text-xs font-black uppercase tracking-widest text-black">
                    Vouch
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/35">{label}</div>
      <div className="mt-2 text-2xl font-black text-cyan-300">{value}</div>
    </div>
  );
}
