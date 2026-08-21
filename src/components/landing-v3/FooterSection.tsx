import { ArrowUpRight, Github, ShieldCheck, Terminal } from "lucide-react";
import VouchEdgeLogo from "../brand/VouchEdgeLogo";

const productLinks = [
  { label: "How it works", href: "#how-it-works", target: "How it works" as const },
  { label: "Methodology", href: "#decision-intelligence", target: "How it works" as const },
  { label: "Live record", href: "#record", target: "Live record" as const },
  { label: "Open Beta", href: "#pricing", target: "Beta" as const },
] as const;

const trustSignals = [
  "Not a sportsbook or financial operator",
  "No synthetic predictions or guaranteed win rates",
  "Unavailable data stays explicitly labeled",
  "Saved decisions retain their original evidence state",
] as const;

export default function FooterSection() {
  return (
    <footer className="relative z-10 w-full border-t border-white/15 bg-black text-zinc-400 font-sans antialiased">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:py-16 md:px-12">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand & Manifesto Column */}
          <div className="sm:col-span-2 lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-4">
              <VouchEdgeLogo showBeta markClassName="h-8 w-8" />
              <p className="max-w-md text-[13px] leading-relaxed text-zinc-300">
                MLB research tools for analysts who want sourced evidence, explicit coverage gaps, and honest post-game review.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/Zhavior/vouchres"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub Repository"
                className="inline-flex items-center gap-2 rounded-none border border-white/20 bg-zinc-950 px-3.5 py-2 font-mono text-xs text-white transition-colors hover:border-white hover:bg-zinc-900"
              >
                <Github className="h-4 w-4" />
                <span>Source Repository</span>
                <ArrowUpRight className="h-3 w-3 opacity-60" />
              </a>

              <div className="inline-flex items-center gap-2 rounded-none border border-emerald-400/30 bg-emerald-950/40 px-3 py-2 font-mono text-[11px] text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-none bg-emerald-400 animate-pulse" />
                <span>Open Beta Research Workspace</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-2 lg:col-start-7">
            <h4 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-white">
              <Terminal className="h-3.5 w-3.5 text-cyan-400" />
              Platform
            </h4>
            <ul className="mt-4 space-y-2.5">
              {productLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="inline-block text-[13px] text-zinc-400 transition-colors hover:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Transparency */}
          <div className="lg:col-span-3">
            <h4 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-white">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Truth Standard
            </h4>
            <ul className="mt-4 space-y-2.5">
              {trustSignals.map((signal) => (
                <li key={signal} className="flex items-start gap-2 text-[12px] leading-snug text-zinc-300">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-none bg-white/40" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Security & Access */}
          <div className="lg:col-span-2">
            <h4 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-white">
              Protocol
            </h4>
            <div className="mt-4 space-y-2.5 text-[12px] leading-relaxed text-zinc-400">
              <p>Non-custodial research tools.</p>
              <p>Terms of service and privacy disclosures reviewed at onboarding.</p>
            </div>
          </div>
        </div>

        {/* Bottom Ledger & Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 font-mono text-[11px] text-zinc-400 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span className="text-white">© {new Date().getFullYear()} VouchEdge Inc.</span>
            <span>·</span>
            <span>All rights reserved.</span>
            <span>·</span>
            <span className="text-zinc-300">By Boyd R. Santos</span>
            <span>·</span>
            <span>Made in Canada 🇨🇦</span>
          </div>
          <div className="flex items-center gap-2 text-center text-[10px] uppercase tracking-wider text-zinc-400 sm:text-right">
            <span>Research & Evidence System</span>
            <span>·</span>
            <span className="text-cyan-300">Not Betting Advice</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
