import { Github } from "lucide-react";
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
    <footer className="border-t border-white/6 bg-ve-obsidian">
      <div className="mx-auto max-w-7xl px-6 py-20">

        <div className="grid gap-16 lg:grid-cols-[2fr_1fr_1fr_1fr]">

          <div>

            <VouchEdgeLogo showBeta markClassName="h-12 w-12" />

            <p className="mt-8 max-w-md leading-8 text-white/55">
              Built for serious sports fans who value evidence,
              transparency and better decision making.
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
              <p>Open Beta</p>
              <p>Independent research tools</p>
              <p>Public grading records</p>
            </div>
          </div>

          <div>
            <h4 className="mb-5 font-semibold text-white">
              Account
            </h4>

            <div className="space-y-4 text-white/55">
              <p>Terms and privacy are reviewed during signup.</p>
              <p>Account controls are available after login.</p>
            </div>
          </div>

        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-white/6 pt-8 text-sm text-white/40 md:flex-row">

          <p>
            © 2026 VouchEdge. All rights reserved.
          </p>

          <p>
            Designed with Aurora.
          </p>

        </div>

      </div>
    </footer>
  );
}
