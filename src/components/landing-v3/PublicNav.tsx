import React from 'react';

export default function PublicNav() {
  return (
    <nav className="fixed top-0 left-0 w-full h-14 sm:h-16 z-50 px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-2 bg-black/95 backdrop-blur-xl border-b-2 border-white/15 font-mono">
      <a href="/" className="inline-flex min-w-0 flex-1 items-center gap-2 text-white no-underline text-[11px] font-bold tracking-wider sm:gap-2.5 sm:text-sm">
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
        </span>
        <img src="/vouchedge-mark-aurora.svg" alt="VouchEdge Logo" width="24" height="24" aria-hidden="true" />
        <span className="truncate font-mono font-black tracking-widest text-cyan-300">VOUCHEDGE</span>
      </a>
      <div className="flex shrink-0 items-center gap-4 sm:gap-6 mr-2 sm:mr-6">
        <a href="/about" className="hidden sm:block text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors no-underline">
          About
        </a>
        <a href="/contact" className="hidden sm:block text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors no-underline">
          Contact
        </a>
        <a href="/blog" className="hidden lg:block text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors no-underline">
          Log
        </a>
      </div>
      <div className="grid shrink-0 grid-cols-2 items-center gap-1.5 sm:flex sm:gap-3">
        <a
          href="/login"
          className="flex items-center justify-center h-8 border border-white/20 bg-black px-2.5 font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-300 transition hover:border-white hover:text-white cursor-pointer rounded-none sm:h-auto sm:border-white/15 sm:bg-zinc-950 sm:px-3.5 sm:py-1.5 sm:text-xs sm:font-bold no-underline"
        >
          LOG IN
        </a>
        <a
          href="/signup"
          className="flex items-center justify-center h-8 border border-cyan-400/50 bg-cyan-950/50 px-2.5 font-mono text-[9px] font-bold uppercase tracking-wider text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-950 hover:text-cyan-200 cursor-pointer rounded-none sm:h-auto sm:px-3.5 sm:py-1.5 sm:text-xs sm:font-bold no-underline"
        >
          JOIN BETA
        </a>
      </div>
    </nav>
  );
}
