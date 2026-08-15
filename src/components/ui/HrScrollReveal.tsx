import React, { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface HrScrollRevealProps {
  children: ReactNode;
  /** Index of the item in the list to calculate stagger delay */
  index?: number;
  /** Manual override for animation delay in seconds */
  delay?: number;
  /** If true, completely bypasses the animation and renders normally */
  disabled?: boolean;
  /** Controls if it scales slightly, or just fades up */
  variant?: 'subtle' | 'panel';
  /** Optional container class */
  className?: string;
  /** 
   * Enables `content-visibility: auto` DOM optimization.
   * Provide the approximate pixel height of the card to eliminate Layout Shift.
   */
  intrinsicHeight?: number;
}

export function HrScrollReveal({
  children,
  index = 0,
  delay,
  disabled = false,
  variant = 'subtle',
  className = '',
  intrinsicHeight,
}: HrScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  
  const optimizationStyles: React.CSSProperties = intrinsicHeight ? {
    contentVisibility: 'auto',
    containIntrinsicSize: `auto ${intrinsicHeight}px`,
  } : {};

  if (disabled || shouldReduceMotion) {
    return <div className={className} style={optimizationStyles}>{children}</div>;
  }

  // Calculate the stagger delay: 50ms per item, capped at 300ms
  // This preserves the waterfall cascade on fast scroll without making deep items feel late
  const computedDelay = delay !== undefined ? delay : Math.min(index * 0.05, 0.3);

  const initial =
    variant === 'panel'
      ? { opacity: 0, y: 14, scale: 0.98 }
      : { opacity: 0, y: 14 };

  const whileInView =
    variant === 'panel'
      ? { opacity: 1, y: 0, scale: 1 }
      : { opacity: 1, y: 0 };

  return (
    <motion.div
      initial={initial}
      whileInView={whileInView}
      viewport={{ once: true, margin: '0px 0px -30px 0px' }}
      transition={{
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1], // Emphasized deceleration curve
        delay: computedDelay,
      }}
      className={className}
      style={optimizationStyles}
    >
      {children}
    </motion.div>
  );
}
