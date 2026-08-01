import { Github, BookOpen, ShieldCheck, FileText, LifeBuoy } from "lucide-react";
import VouchEdgeLogo from "../brand/VouchEdgeLogo";

const product = ["Live Games", "Research", "Results", "Pricing"] as const;

export type FooterNavigationTarget =
  | (typeof product)[number]
  | "GitHub";

export interface FooterSectionProps {
  onNavigate?: (target: FooterNavigationTarget) => void;
}

export default function FooterSection({ onNavigate }: FooterSectionProps) {
  return (
    <footer className="border-t border-white/6 bg-[#03060b]">
      <div className="mx-auto max-w-7xl px-6 py-20">

        <div className="grid gap-16 lg:grid-cols-[2fr_1fr_1fr_1fr]">

          <div>

            <VouchEdgeLogo showBeta markClassName="h-12 w-12" />

            <p className="mt-8 max-w-md leading-8 text-white/55">
              Decision Intelligence for Sports.

              Premium research, AI-powered insights, transparent analytics,
              and evidence-first recommendations built for serious sports fans.
            </p>

            <div className="mt-10 flex gap-4">

              <button
                type="button"
                aria-label="GitHub"
                onClick={() => onNavigate?.("GitHub")}
                className="rounded-xl border border-white/10 p-3 text-white/60 transition hover:border-blue-400/30 hover:text-blue-300"
              >
                <Github className="h-5 w-5" />
              </button>

            </div>

          </div>

          <div>
            <h4 className="mb-5 font-semibold text-white">
              Product
            </h4>

            <div className="space-y-4">
              {product.map(item => (
                <button
                  type="button"
                  key={item}
                  onClick={() => onNavigate?.(item)}
                  className="block text-left text-white/55 transition hover:text-white"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-5 font-semibold text-white">
              Company
            </h4>

            <div className="space-y-4 text-white/55">
              <a
                href="/about"
                className="flex items-center gap-2 transition hover:text-white"
              >
                About VouchEdge
              </a>
              <a
                href="/contact"
                className="flex items-center gap-2 transition hover:text-white"
              >
                Contact
              </a>
              <button type="button" className="block transition hover:text-white">
                Careers
              </button>
              <button type="button" className="block transition hover:text-white">
                Open Beta
              </button>
            </div>
          </div>

          <div>
            <h4 className="mb-5 font-semibold text-white">
              Legal
            </h4>

            <div className="space-y-4 text-white/55">
              <button type="button" className="flex items-center gap-2 transition hover:text-white">
                <ShieldCheck className="h-4 w-4" />
                Privacy Policy
              </button>

              <button type="button" className="flex items-center gap-2 transition hover:text-white">
                <FileText className="h-4 w-4" />
                Terms of Service
              </button>

              <button type="button" className="flex items-center gap-2 transition hover:text-white">
                <BookOpen className="h-4 w-4" />
                Cookie Policy
              </button>

              <button type="button" className="flex items-center gap-2 transition hover:text-white">
                <LifeBuoy className="h-4 w-4" />
                Responsible Gaming
              </button>

              <a
                href="/disclaimer"
                className="flex items-center gap-2 transition hover:text-white"
              >
                Disclaimer
              </a>

              <a
                href="/security"
                className="flex items-center gap-2 transition hover:text-white"
              >
                Security
              </a>

              <a
                href="/dmca"
                className="flex items-center gap-2 transition hover:text-white"
              >
                DMCA
              </a>
            </div>
          </div>

        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-white/6 pt-8 text-sm text-white/40 md:flex-row">

          <p>
            © 2026 VouchEdge. All rights reserved.
          </p>

          <div className="flex flex-col items-end gap-2 text-right">

            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Open Beta
            </span>

            <p>Built in Canada 🇨🇦</p>

            <p>Powered by Aurora Intelligence</p>

          </div>

        </div>

      </div>
    </footer>
  );
}
