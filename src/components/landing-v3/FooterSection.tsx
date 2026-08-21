import { ArrowUpRight, Github, ShieldCheck, Terminal } from "lucide-react";
import VouchEdgeLogo from "../brand/VouchEdgeLogo";

const productLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Methodology", href: "/#decision-intelligence" },
  { label: "Live record", href: "/#record" },
  { label: "Open Beta", href: "/#pricing" },
] as const;

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Transmission Log", href: "/blog" },
  { label: "Privacy Policy", href: "/policy" },
  { label: "Terms of Service", href: "/terms" },
] as const;

export default function FooterSection() {
  return (
    <footer className="relative z-10 w-full border-t border-white/10 bg-black text-zinc-400 font-sans antialiased">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 lg:gap-12 items-start">
          
          {/* Left Column: Brand & System Status */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <VouchEdgeLogo showBeta markClassName="h-7 w-7" />
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-zinc-400 font-mono">
              MLB research tools for analysts who demand sourced evidence, explicit coverage gaps, and immutable post-game review.
            </p>
            
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <a
                href="https://github.com/Zhavior/vouchres"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub Repository"
                className="inline-flex items-center gap-1.5 border border-white/15 bg-zinc-950 px-2.5 py-1 font-mono text-[11px] text-zinc-300 transition-colors hover:border-white hover:text-white"
              >
                <Github className="h-3.5 w-3.5" />
                <span>GitHub</span>
                <ArrowUpRight className="h-3 w-3 opacity-50" />
              </a>

              <div className="inline-flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live System Node</span>
              </div>
            </div>
          </div>

          {/* Middle Column: Platform Links */}
          <div className="md:col-span-3">
            <h4 className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-300">
              <Terminal className="h-3 w-3 text-cyan-400" />
              Platform
            </h4>
            <ul className="mt-3 space-y-2 font-mono text-xs">
              {productLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-zinc-400 transition-colors hover:text-cyan-300 no-underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Company & Legal */}
          <div className="md:col-span-4">
            <h4 className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-300">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Company & Transparency
            </h4>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-zinc-400 transition-colors hover:text-white no-underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Ledger & Copyright */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[11px] text-zinc-500 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-2.5">
            <span className="text-zinc-300">© {new Date().getFullYear()} VouchEdge Inc.</span>
            <span>·</span>
            <span className="text-zinc-400">By Boyd R. Santos</span>
            <span>·</span>
            <span>Made in Canada 🇨🇦</span>
          </div>
          
          <div className="flex items-center gap-2 text-center text-[10px] uppercase tracking-wider text-zinc-500 sm:text-right">
            <span>Research & Evidence System</span>
            <span>·</span>
            <span className="text-cyan-400/80">Not Betting Advice</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
