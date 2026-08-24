import React from 'react';
import { ArrowUpRight, BookOpen, Code2, Github, Mail, ShieldCheck, Terminal } from 'lucide-react';
import VouchEdgeLogo from '../brand/VouchEdgeLogo';

/*
 * The world footer.
 *
 * This replaces landing-v3's FooterSection, which used to render on the
 * logged-in shell (HomeFeedLayout) and the policy pages while this one carried
 * the public V4 pages. Two footers meant two sets of links and two answers to
 * "where are the terms" — the legal links only ever existed on the old one.
 *
 * Every destination below is verified against the current route table in
 * App.tsx and the anchor ids on the V4 landing. The old footer also linked
 * /#how-it-works, /#decision-intelligence, /#record and /#pricing; those were
 * V3 section anchors and no longer exist on the V4 landing, so they are not
 * carried over rather than shipped as four dead links.
 */

const platformLinks = [
  { label: 'Command Desk', href: '/hr-board' },
  { label: 'Intelligence', href: '/#intelligence' },
  { label: 'Methodology', href: '/#methodology' },
] as const;

const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Transmission Log', href: '/blog' },
  { label: 'Privacy Policy', href: '/policy' },
  { label: 'Terms of Service', href: '/terms' },
] as const;

const networkLinks = [
  { label: 'Developers', href: '/dev', icon: Code2 },
  { label: 'Journal', href: '/blog', icon: BookOpen },
  { label: 'Contact', href: '/contact', icon: Mail },
] as const;

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050505]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_.7fr_.9fr_.7fr]">

          {/* Brand & system status */}
          <div className="space-y-5">
            <a href="/" className="inline-flex items-center no-underline" aria-label="VouchEdge home">
              <VouchEdgeLogo showBeta markClassName="h-7 w-7" />
            </a>

            <p className="max-w-md text-sm leading-6 text-white/55">
              MLB research tools for analysts who demand sourced evidence, explicit coverage gaps,
              and immutable post-game review.
            </p>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="https://github.com/Zhavior/vouchres"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub repository"
                className="inline-flex items-center gap-1.5 border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-white/70 no-underline transition-colors hover:border-white/[0.16] hover:bg-white/[0.08] hover:text-white"
              >
                <Github className="h-3.5 w-3.5" />
                <span>GitHub</span>
                <ArrowUpRight className="h-3 w-3 opacity-50" />
              </a>

              <span className="inline-flex items-center gap-1.5 border border-ve-emerald/25 bg-ve-emerald/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ve-emerald">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ve-emerald" aria-hidden="true" />
                Live System Node
              </span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              <Terminal className="h-3 w-3 text-ve-cyan" />
              Platform
            </h4>
            <div className="space-y-3">
              {platformLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block text-sm text-white/55 no-underline transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Company & transparency */}
          <div>
            <h4 className="mb-4 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              <ShieldCheck className="h-3 w-3 text-ve-emerald" />
              Company &amp; Transparency
            </h4>
            <div className="space-y-3">
              {companyLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block text-sm text-white/55 no-underline transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Network */}
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              Network
            </h4>
            <div className="space-y-3">
              {networkLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  className="group flex items-center gap-2 text-sm text-white/55 no-underline transition-colors hover:text-white"
                >
                  <Icon className="h-3.5 w-3.5 text-white/25 transition-colors group-hover:text-ve-emerald" />
                  {label}
                  <ArrowUpRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger line */}
        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.06] pt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="text-white/55">© {new Date().getFullYear()} VouchEdge Inc.</span>
            <span>·</span>
            <span>By Boyd R. Santos</span>
            <span>·</span>
            <span>Made in Canada 🇨🇦</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span>Research &amp; Evidence System</span>
            <span>·</span>
            <span className="text-ve-cyan">Not Betting Advice</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
