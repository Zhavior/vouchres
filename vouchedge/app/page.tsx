"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FeaturedVouch = {
  id: string;
  player: string;
  team: string;
  pitcher: string;
  confidence: number;
  line: string;
};

type HomeData = {
  hero: {
    gamesTonight: number | null;
    confidence: number | null;
    lastUpdated: string;
  };
  pulse: string[];
  featuredVouches: FeaturedVouch[];
  stats: {
    games: number;
    candidates: number;
  };
};

export default function LandingPage() {
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("vouchedge_auth_token");
    if (token) {
      window.location.href = "/edge-island";
      return;
    }

    async function load() {
      const res = await fetch("/api/home", { cache: "no-store" });
      setData(await res.json());
    }

    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  const vouches = data?.featuredVouches ?? [];

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,.24),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(16,185,129,.14),transparent_30%),linear-gradient(180deg,#020617_0%,#000_55%,#020617_100%)]" />
      <div className="fixed inset-0 opacity-[0.055] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
          <Link href="/" className="text-3xl font-black italic tracking-tight">
            Vouch<span className="text-cyan-300">Edge</span>
          </Link>

          <div className="hidden gap-8 text-xs font-black uppercase tracking-[0.25em] text-white/45 md:flex">
            <Link href="#pulse" className="hover:text-cyan-300">Pulse</Link>
            <Link href="#vouches" className="hover:text-cyan-300">Vouches</Link>
            <Link href="/pricing" className="hover:text-cyan-300">Pricing</Link>
          </div>

          <Link href="/login" className="rounded-full border border-cyan-300/40 px-5 py-2 text-xs font-black uppercase tracking-widest text-cyan-300 hover:bg-cyan-300 hover:text-black">
            Login
          </Link>
        </nav>

        <section className="mx-auto grid min-h-[82vh] max-w-7xl grid-cols-1 items-center gap-16 px-6 py-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="mb-6 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-300">
              Live MLB Intelligence
            </div>

            <h1 className="text-6xl font-black uppercase leading-[0.86] tracking-tighter md:text-8xl">
              The edge before
              <span className="block text-cyan-300 drop-shadow-[0_0_35px_rgba(103,232,249,.45)]">
                the market moves.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-white/60">
              AI confidence, live MLB signal, and community conviction built into one premium betting command center.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/login" className="rounded-2xl bg-cyan-300 px-8 py-4 text-sm font-black uppercase tracking-widest text-black shadow-[0_0_45px_rgba(103,232,249,.28)] hover:bg-white">
                Enter Edge Island
              </Link>
              <Link href="#vouches" className="rounded-2xl border border-white/15 bg-white/[0.04] px-8 py-4 text-sm font-black uppercase tracking-widest text-white/70 hover:border-white/40 hover:text-white">
                See The Vouch
              </Link>
            </div>
          </div>

          <div id="pulse" className="lg:col-span-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">The Pulse</div>
                <div className="mt-1 text-xs text-white/35">Updated live from VouchEdge</div>
              </div>
              <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_20px_#34d399]" />
            </div>

            <div className="mb-6 grid grid-cols-3 gap-3">
              <Stat label="Games" value={String(data?.stats.games ?? 0)} />
              <Stat label="Candidates" value={String(data?.stats.candidates ?? 0)} />
              <Stat label="AI Edge" value={`${data?.hero.confidence ?? 0}%`} />
            </div>

            <div className="space-y-3">
              {(data?.pulse ?? ["Loading live pulse..."]).map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/70">
                  ⚡ {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="vouches" className="mx-auto max-w-7xl px-6 pb-24">
          <div className="mb-8">
            <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              Most Vouched Tonight
            </div>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-6xl">
              Community conviction meets AI signal.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {vouches.map((pick, index) => (
              <div key={pick.id} className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.055] p-6 shadow-[0_0_60px_rgba(34,211,238,.08)] backdrop-blur-xl">
                <div className="mb-8 flex items-center justify-between">
                  <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/45">
                    #{index + 1} Trending
                  </div>
                  <div className="text-xs font-black text-emerald-300">{pick.confidence}% AI</div>
                </div>

                <div className="text-3xl font-black">{pick.player}</div>
                <div className="mt-2 text-sm text-white/45">{pick.team} vs {pick.pitcher}</div>

                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/35">Pick</div>
                    <div className="mt-1 text-xl font-black">Home Run</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-white/35">Line</div>
                    <div className="mt-1 text-2xl font-black text-cyan-300">{pick.line}</div>
                  </div>
                </div>

                <button className="mt-8 w-full rounded-2xl bg-cyan-300 py-4 text-xs font-black uppercase tracking-widest text-black hover:bg-white">
                  Vouch This Pick
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-28">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl">
            <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
              Edge Island
            </div>
            <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-black uppercase tracking-tight md:text-6xl">
              Your personal command center after login.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/55">
              Track the pulse, follow vouches, watch the HR board, and manage your betting intelligence from one place.
            </p>
            <Link href="/login" className="mt-8 inline-flex rounded-2xl bg-cyan-300 px-8 py-4 text-sm font-black uppercase tracking-widest text-black hover:bg-white">
              Enter Edge Island
            </Link>
          </div>
        </section>
      </div>
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
