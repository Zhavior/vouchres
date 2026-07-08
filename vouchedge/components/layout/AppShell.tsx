import Link from "next/link";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#020617] text-white overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,.20),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(16,185,129,.14),transparent_28%),linear-gradient(180deg,#020617,#000,#020617)]" />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-black italic">
            Vouch<span className="text-cyan-300">Edge</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-widest">
            <Link href="/" className="rounded-full border border-white/10 px-4 py-2 text-white/60 hover:text-white">
              Home
            </Link>
            <Link href="/edge-island" className="rounded-full bg-cyan-300 px-4 py-2 text-black">
              Edge Island
            </Link>
            <Link href="/dashboard" className="rounded-full border border-white/10 px-4 py-2 text-white/60 hover:text-white">
              Dashboard
            </Link>
            <Link href="/pricing" className="rounded-full border border-white/10 px-4 py-2 text-white/60 hover:text-white">
              Pricing
            </Link>
            <Link href="/login" className="rounded-full border border-cyan-300/40 px-4 py-2 text-cyan-300 hover:bg-cyan-300 hover:text-black">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {children}
    </main>
  );
}
