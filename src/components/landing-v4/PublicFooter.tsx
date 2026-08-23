import React from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  Mail,
  ShieldCheck,
} from 'lucide-react';

const productLinks = [
  { label: 'Command Desk', href: '/hr-board' },
  { label: 'Intelligence', href: '/#intelligence' },
  { label: 'Methodology', href: '/#methodology' },
];

const networkLinks = [
  { label: 'Developers', href: '/dev', icon: Code2 },
  { label: 'Journal', href: '/blog', icon: BookOpen },
  { label: 'Contact', href: '/contact', icon: Mail },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-black">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_.8fr_.8fr]">
          
          <div className="space-y-5">
            <a
              href="/"
              className="inline-flex items-center gap-3 no-underline"
              aria-label="VouchEdge home"
            >
              <div className="w-8 h-8 border border-emerald-400/30 bg-emerald-400/[0.06] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>

              <span className="text-sm font-bold tracking-[0.16em] text-white">
                VOUCHEDGE
              </span>
            </a>

            <p className="max-w-md text-sm leading-6 text-zinc-500">
              Evidence-driven MLB intelligence with explicit coverage,
              timestamped hypotheses, and permanent audit records.
            </p>

            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              System Operational
            </div>
          </div>

          <div>
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Product
            </div>

            <div className="space-y-3">
              {productLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block text-sm text-zinc-400 hover:text-white transition-colors no-underline"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              Network
            </div>

            <div className="space-y-3">
              {networkLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  className="group flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors no-underline"
                >
                  <Icon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                  {label}
                  <ArrowUpRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-5 border-t border-white/[0.06] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-700">
          <span>© {new Date().getFullYear()} VouchEdge</span>
          <span>Evidence over hindsight.</span>
        </div>
      </div>
    </footer>
  );
}
