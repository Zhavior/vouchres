import { ArrowUpRight, Github, ShieldCheck, Terminal } from "lucide-react";
import VouchEdgeLogo from "../brand/VouchEdgeLogo";

const productLinks = [
  { label: "How it works", href: "#how-it-works", target: "How it works" as const },
  { label: "Operations", href: "#process", target: "How it works" as const },
  { label: "Live record", href: "#record", target: "Live record" as const },
  { label: "Open Beta", href: "#access", target: "Beta" as const },
] as const;

const trustSignals = [
  "Not a sportsbook or financial operator",
  "No synthetic predictions or guaranteed win rates",
  "Unavailable data stays explicitly labeled",
  "Original pre-game board state locked before pitch",
] as const;

export type FooterNavigationTarget =
  | "How it works"
  | "Live record"
  | "Beta"
  | "GitHub";

export interface FooterSectionProps {
  onNavigate?: (target: FooterNavigationTarget) => void;
}

export default function FooterSection({ onNavigate }: FooterSectionProps) {
  return (
    <footer className="relative z-10 w-full border-t border-[#292929] bg-[#08090c] text-[#979793] font-sans antialiased">
      {/* Decorative subtle ambient top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-500/[0.03] to-transparent"
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-7xl px-6 py-14 sm:py-16 md:px-12">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand & Manifesto Column */}
          <div className="sm:col-span-2 lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-4">
              <VouchEdgeLogo showBeta markClassName="h-8 w-8" />
              <p className="max-w-md text-[13px] leading-relaxed text-[#979793]">
                Empirical MLB intelligence and home-run signal pipelines. Engineered for analysts who demand verified evidence before first pitch and immutable track record accountability post-game.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/vouchedge"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub Repository"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate("GitHub");
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-[#292929] bg-[#0c0c0c] px-3.5 py-2 font-mono text-xs text-[#d9d9d4] transition-colors hover:border-[#8be6f4]/40 hover:bg-[#141414] hover:text-[#8be6f4]"
              >
                <Github className="h-4 w-4" />
                <span>Source & Telemetry</span>
                <ArrowUpRight className="h-3 w-3 opacity-60" />
              </a>

              <div className="inline-flex items-center gap-2 rounded-lg border border-[#292929]/80 bg-[#0c0c0c]/80 px-3 py-2 font-mono text-[11px] text-[#67d39b]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#67d39b] animate-pulse" />
                <span>MLB Engine v3.2 Active</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-2 lg:col-start-7">
            <h4 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#d9d9d4]">
              <Terminal className="h-3.5 w-3.5 text-[#8be6f4]" />
              Platform
            </h4>
            <ul className="mt-4 space-y-2.5">
              {productLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      if (onNavigate) {
                        e.preventDefault();
                        onNavigate(item.target);
                      }
                    }}
                    className="inline-block text-[13px] text-[#979793] transition-colors hover:text-[#f1f1ef]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & Transparency */}
          <div className="lg:col-span-3">
            <h4 className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#d9d9d4]">
              <ShieldCheck className="h-3.5 w-3.5 text-[#67d39b]" />
              Truth Standard
            </h4>
            <ul className="mt-4 space-y-2.5">
              {trustSignals.map((signal) => (
                <li key={signal} className="flex items-start gap-2 text-[12px] leading-snug text-[#979793]">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#292929]" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Security & Access */}
          <div className="lg:col-span-2">
            <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#d9d9d4]">
              Protocol
            </h4>
            <div className="mt-4 space-y-2.5 text-[12px] leading-relaxed text-[#979793]">
              <p>Non-custodial research tools.</p>
              <p>Terms of service and privacy disclosures reviewed at onboarding.</p>
            </div>
          </div>
        </div>

        {/* Bottom Ledger & Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#292929] pt-6 font-mono text-[11px] text-[#979793] sm:flex-row">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} VouchEdge Inc.</span>
            <span>·</span>
            <span>All rights reserved.</span>
          </div>
          <div className="flex items-center gap-2 text-center text-[10px] uppercase tracking-wider text-[#979793]/70 sm:text-right">
            <span>Research & Evidence System</span>
            <span>·</span>
            <span className="text-[#8be6f4]/80">Not Betting Advice</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
