import { Github } from "lucide-react";
import VouchEdgeLogo from "../brand/VouchEdgeLogo";

const product = ["Research preview", "How it works", "Results", "Beta"] as const;

export type FooterNavigationTarget =
  | (typeof product)[number]
  | "GitHub";

export interface FooterSectionProps {
  onNavigate?: (target: FooterNavigationTarget) => void;
}

export default function FooterSection({ onNavigate }: FooterSectionProps) {
  return (
    <footer className="border-t border-white/6 bg-ve-obsidian">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <VouchEdgeLogo showBeta markClassName="h-12 w-12" />
            <p className="mt-6 max-w-md leading-8 text-white/55">
              MLB research for bettors and serious analysts who want evidence before first pitch —
              with transparent limits and post-game accountability.
            </p>
            <div className="mt-8 flex gap-4">
              <button
                type="button"
                aria-label="GitHub"
                onClick={() => onNavigate?.("GitHub")}
                className="rounded-xl border border-white/10 p-3 text-white/60 transition hover:border-emerald-400/30 hover:text-emerald-300"
              >
                <Github className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div>
            <h4 className="mb-5 font-semibold text-white">Product</h4>
            <div className="space-y-4">
              {product.map((item) => (
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
            <h4 className="mb-5 font-semibold text-white">Trust</h4>
            <div className="space-y-4 text-white/55">
              <p>Not a sportsbook</p>
              <p>No guaranteed results</p>
              <p>Missing data stays labeled</p>
            </div>
          </div>

          <div>
            <h4 className="mb-5 font-semibold text-white">Account</h4>
            <div className="space-y-4 text-white/55">
              <p>Terms and privacy are reviewed during signup.</p>
              <p>Account controls are available after login.</p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-white/6 pt-8 text-sm text-white/40 md:flex-row">
          <p>© 2026 VouchEdge. All rights reserved.</p>
          <p>Research tools. Not betting advice.</p>
        </div>
      </div>
    </footer>
  );
}
