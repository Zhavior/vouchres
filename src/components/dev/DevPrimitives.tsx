import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Shared primitives for the /dev operator page.
 *
 * Motion here only ever communicates hierarchy — a section settling into place
 * once, on first view. Under `prefers-reduced-motion` every reveal renders
 * statically so nothing arrives in visible pieces.
 */

export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ve-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-black';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Hero content reveals on mount; everything below the fold reveals in view. */
  onMount?: boolean;
}

export function Reveal({ children, className, delay = 0, onMount = false }: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const transition = { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const };

  if (onMount) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

/** A thin rule that draws itself in once, left to right. */
export function ScanRule({ className = '' }: { className?: string }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={`h-px w-full bg-white/10 ${className}`} />;
  }

  return (
    <motion.div
      className={`h-px w-full origin-left bg-white/10 ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    />
  );
}

/** Status point. `pulse` is reserved for genuinely live state. */
export function StatusDot({
  className = 'bg-ve-emerald',
  pulse = false,
}: {
  className?: string;
  pulse?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <span className="relative inline-flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
      {pulse && !reduced && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${className}`} />
      )}
      <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${className}`} />
    </span>
  );
}

/**
 * Section masthead: an indexed label, a rule, and an optional editorial lede.
 * The number is the page's spine — it is what makes the scroll read as a
 * document rather than a stack of cards.
 */
export function SectionHeader({
  index,
  label,
  title,
  lede,
  accentClass = 'text-ve-cyan',
}: {
  index: string;
  label: string;
  title?: React.ReactNode;
  lede?: React.ReactNode;
  accentClass?: string;
}) {
  return (
    <header className="mb-14 sm:mb-20">
      <Reveal className="flex items-baseline gap-4">
        <span className={`font-mono text-[10px] uppercase tracking-[0.28em] ${accentClass}`}>{index}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">{label}</span>
      </Reveal>

      <ScanRule className="mt-5" />

      {(title || lede) && (
        <Reveal className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-12" delay={0.05}>
          {title && (
            <h2 className="min-w-0 text-3xl leading-[1.05] font-bold tracking-tight text-white sm:text-4xl lg:col-span-7 lg:text-5xl">
              {title}
            </h2>
          )}
          {lede && (
            <p className="min-w-0 max-w-xl text-base leading-relaxed font-light text-white/40 lg:col-span-5 lg:pt-2">
              {lede}
            </p>
          )}
        </Reveal>
      )}
    </header>
  );
}
