/**
 * VouchEdge brand mark — vector HD source of truth for splash, boot, and icons.
 * Geometry mirrors /public/brand/vouchedge-mark.svg (shield + vouch identity).
 */
import React from 'react';

export type VouchEdgeMarkProps = {
  size?: number | string;
  className?: string;
  /** boot = draw-in + pulse; idle = soft breathe; static = no CSS animation */
  variant?: 'boot' | 'idle' | 'static';
  title?: string;
};

export function VouchEdgeMark({
  size = 96,
  className = '',
  variant = 'idle',
  title = 'VouchEdge',
}: VouchEdgeMarkProps) {
  const dim = typeof size === 'number' ? `${size}px` : size;
  const animClass =
    variant === 'boot' ? 've-mark-boot' : variant === 'idle' ? 've-mark-idle' : '';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      width={dim}
      height={dim}
      className={`ve-brand-mark ${animClass} ${className}`.trim()}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="veMarkStroke" x1="180" y1="120" x2="844" y2="900" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="55%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#22D3A6" />
        </linearGradient>
        <linearGradient id="veMarkCore" x1="420" y1="300" x2="620" y2="620" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
        <radialGradient id="veMarkGlow" cx="50%" cy="42%" r="48%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.28" />
          <stop offset="70%" stopColor="#00E5FF" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1024" height="1024" rx="224" fill="#020617" className="ve-mark-tile" />
      <circle cx="512" cy="470" r="320" fill="url(#veMarkGlow)" className="ve-mark-glow" />

      <path
        className="ve-mark-shield"
        d="M512 168 L780 304 V552 C780 690 668 812 512 880 C356 812 244 690 244 552 V304 Z"
        stroke="url(#veMarkStroke)"
        strokeWidth="36"
        strokeLinejoin="round"
        fill="rgba(0,229,255,0.06)"
      />

      <g className="ve-mark-identity">
        <circle cx="512" cy="430" r="92" fill="url(#veMarkCore)" />
        <path
          d="M360 620 C392 560 444 528 512 528 C580 528 632 560 664 620"
          stroke="url(#veMarkCore)"
          strokeWidth="48"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

export default VouchEdgeMark;
