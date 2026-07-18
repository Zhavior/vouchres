/**
 * VouchEdge brand mark — craft level 2 optical VE lockup.
 * Mirrors /public/brand/vouchedge-mark.svg
 */
import React from 'react';

export type VouchEdgeMarkProps = {
  size?: number | string;
  className?: string;
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
      data-craft-level="2"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="veMarkPlate" x1="512" y1="0" x2="512" y2="1024" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06101C" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="veMarkStroke" x1="240" y1="160" x2="780" y2="880" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A5F3FC" />
          <stop offset="50%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <linearGradient id="veMarkShieldFill" x1="512" y1="180" x2="512" y2="860" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="veMarkLetter" x1="300" y1="380" x2="760" y2="720" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FEFF" />
          <stop offset="55%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <radialGradient id="veMarkGlow" cx="50%" cy="42%" r="46%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.16" />
          <stop offset="70%" stopColor="#00E5FF" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1024" height="1024" rx="224" fill="url(#veMarkPlate)" className="ve-mark-tile" />
      <circle cx="512" cy="468" r="300" fill="url(#veMarkGlow)" className="ve-mark-glow" />

      <path
        className="ve-mark-shield"
        d="M512 176
           C598 176 708 228 748 278
           V528
           C748 662 646 788 512 856
           C378 788 276 662 276 528
           V278
           C316 228 426 176 512 176 Z"
        fill="url(#veMarkShieldFill)"
        stroke="url(#veMarkStroke)"
        strokeWidth="30"
        strokeLinejoin="round"
      />

      <g className="ve-mark-letters ve-mark-identity ve-mark-optical" aria-label="VE">
        <path
          className="letter-v"
          d="M318 402
             L430 678
             L494 678
             L606 402
             L542 402
             L462 618
             L382 402
             Z"
          fill="url(#veMarkLetter)"
        />
        <g className="letter-e">
          <path d="M650 402 H706 V678 H650 Z" fill="url(#veMarkLetter)" />
          <path d="M706 402 H790 V458 H706 Z" fill="url(#veMarkLetter)" />
          <path d="M706 512 H772 V568 H706 Z" fill="url(#veMarkLetter)" />
          <path d="M706 622 H790 V678 H706 Z" fill="url(#veMarkLetter)" />
        </g>
      </g>
    </svg>
  );
}

export default VouchEdgeMark;
