import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { Shield, ArrowUpRight } from 'lucide-react';

const navItems = [
  { label: 'Intelligence', href: '/#intelligence' },
  { label: 'Methodology', href: '/#methodology' },
  { label: 'Developers', href: '/dev' },
  { label: 'Journal', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

const MOBILE_MENU_ID = 'vouchedge-system-index';

export default function Navbar() {
  const { scrollY } = useScroll();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const backgroundColor = useTransform(
    scrollY,
    [0, 100],
    ['rgba(5, 5, 5, 0)', 'rgba(5, 5, 5, 0.88)']
  );

  const borderBottom = useTransform(
    scrollY,
    [0, 100],
    [
      '1px solid rgba(255,255,255,0)',
      '1px solid rgba(255,255,255,0.06)',
    ]
  );

  const close = useCallback(() => setOpen(false), []);

  // Escape closes and returns focus to the trigger.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Body scroll lock. The panel covers the viewport, so the document behind it
  // must not scroll. The cleanup restores whatever was there before rather than
  // hard-coding '', and runs on unmount too — navigating away with the index
  // open previously left `overflow: hidden` stranded on <body>.
  useEffect(() => {
    if (!open) return;

    const { body, documentElement: html } = document;
    // Lock both: <html> is the scrolling element in this document, so locking
    // <body> alone left the page behind the panel fully scrollable.
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
    };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'contain';

    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehavior = previous.bodyOverscroll;
    };
  }, [open]);

  // Crossing into the desktop breakpoint must never leave the panel stranded.
  useEffect(() => {
    if (!open) return;

    const query = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (query.matches) setOpen(false);
    };

    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [open]);

  // Move focus into the index so keyboard users land on the first entry.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLAnchorElement>('a[href]')?.focus();
  }, [open]);

  return (
    <>
    <motion.nav
      style={{ backgroundColor, borderBottom }}
      className="fixed top-0 left-0 w-full z-[100] backdrop-blur-xl"
    >
      <div className="container mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <a
          href="/"
          aria-label="VouchEdge home"
          className="flex items-center gap-3 group no-underline shrink-0"
        >
          <div className="w-8 h-8 rounded bg-ve-emerald/10 border border-ve-emerald/30 flex items-center justify-center group-hover:border-ve-emerald transition-colors">
            <Shield size={18} className="text-ve-emerald" />
          </div>

          <span className="text-lg font-bold tracking-tighter italic text-white">
            VOUCHEDGE
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="terminal-text hover:text-white transition-colors no-underline"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Secondary auth entry. Deliberately a quiet text link, not a second
              button — Launch Desk stays the single visual CTA in the bar. */}
          <a
            href="/login"
            className="hidden sm:inline-flex items-center terminal-text hover:text-white transition-colors no-underline"
          >
            Log in
          </a>

          {/* Product CTA — hidden on the narrowest widths, where it lives in the index */}
          <a
            href="/hr-board"
            className="hidden sm:inline-flex group items-center gap-2 px-5 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-ve-emerald transition-colors no-underline"
          >
            Launch Desk
            <ArrowUpRight
              size={13}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </a>

          {/* Mobile / tablet index trigger */}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            aria-controls={MOBILE_MENU_ID}
            className="lg:hidden relative flex h-11 w-11 shrink-0 sm:h-9 sm:w-9 items-center justify-center border border-white/10 bg-white/[0.02] text-white/70 transition-colors hover:border-ve-emerald/40 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
          >
            <span aria-hidden="true" className="flex h-3 w-4 flex-col justify-between">
              <span
                className={`block h-px w-full bg-current transition-transform duration-200 ${open ? 'translate-y-[5.5px] rotate-45' : ''}`}
              />
              <span
                className={`block h-px w-full bg-current transition-opacity duration-200 ${open ? 'opacity-0' : 'opacity-100'}`}
              />
              <span
                className={`block h-px w-full bg-current transition-transform duration-200 ${open ? '-translate-y-[5.5px] -rotate-45' : ''}`}
              />
            </span>
          </button>
        </div>
      </div>

    </motion.nav>

      {/*
        Mobile index. Portalled to <body> on purpose: the nav carries
        backdrop-blur-xl plus a motion transform, and either one makes it the
        containing block for position:fixed descendants — rendered inside it the
        panel sized against the 65px bar (measured 1px tall) instead of the
        viewport. CSS-driven reveal, so visibility never depends on a JS frame.
      */}
      {open && createPortal(
        <>
          <div
            onClick={close}
            aria-hidden="true"
            className="ve-index-scrim lg:hidden fixed inset-x-0 top-16 bottom-0 z-[98] bg-black/70"
          />

          <div
            ref={panelRef}
            id={MOBILE_MENU_ID}
            className="ve-index-panel lg:hidden fixed inset-x-0 top-16 bottom-0 z-[99] flex flex-col overflow-y-auto overscroll-contain border-t border-white/10 bg-[#050505]"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-3">
              <span className="terminal-text">System Index</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ve-emerald">● Live</span>
            </div>

            <nav aria-label="Primary">
              <ul className="list-none m-0 p-0">
                {navItems.map((item, index) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      onClick={close}
                      className="group relative flex items-center justify-between gap-4 border-b border-white/5 px-6 py-4 no-underline transition-colors hover:bg-white/[0.02] focus:bg-white/[0.04] focus:outline-none"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-0 h-full w-px origin-top scale-y-0 bg-ve-emerald transition-transform duration-300 group-hover:scale-y-100 group-focus:scale-y-100"
                      />
                      <span className="flex min-w-0 items-center gap-4">
                        <span className="font-mono text-[10px] tabular-nums text-white/20 transition-colors group-hover:text-ve-cyan group-focus:text-ve-cyan">
                          {String(index).padStart(2, '0')}
                        </span>
                        <span className="truncate text-xs font-medium uppercase tracking-[0.2em] text-white/60 transition-colors group-hover:text-white group-focus:text-white">
                          {item.label}
                        </span>
                      </span>
                      <ArrowUpRight
                        size={14}
                        aria-hidden="true"
                        className="shrink-0 text-white/15 transition-colors group-hover:text-ve-emerald group-focus:text-ve-emerald"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* mt-auto pins the pair to the foot of the filled panel. */}
            <div className="mt-auto border-t border-white/5 px-6 py-5">
              <a
                href="/login"
                onClick={close}
                className="mb-3 flex w-full items-center justify-center border border-white/15 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/70 no-underline transition-colors hover:border-white/30 hover:text-white focus:outline-none focus:ring-1 focus:ring-ve-emerald focus:ring-offset-2 focus:ring-offset-[#050505]"
              >
                Log in
              </a>
              <a
                href="/hr-board"
                onClick={close}
                className="group flex w-full items-center justify-center gap-2 bg-white px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-black no-underline transition-colors hover:bg-ve-emerald focus:outline-none focus:ring-1 focus:ring-ve-emerald focus:ring-offset-2 focus:ring-offset-[#050505]"
              >
                Launch Desk
                <ArrowUpRight
                  size={13}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
