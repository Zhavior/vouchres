import React from 'react';

/**
 * Page environment: obsidian ground, a very faint technical grid, and two thin
 * structural rules that align the editorial column. Static, GPU-cheap, and
 * deliberately almost invisible — it should read as drafting paper, not decor.
 */
export default function DevBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      {/* Technical grid */}
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(79,184,220,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(79,184,220,0.10) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* Structural column rules — only drawn where there is room for them */}
      <div className="absolute inset-y-0 left-1/2 hidden w-full max-w-7xl -translate-x-1/2 px-6 xl:block">
        <div className="relative h-full">
          <span className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent" />
          <span className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent" />
        </div>
      </div>
    </div>
  );
}
