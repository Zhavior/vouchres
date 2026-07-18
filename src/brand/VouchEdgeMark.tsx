/**
 * VouchEdge brand mark — vector source of truth (splash, boot, icons).
 * Geometry mirrors /public/brand/vouchedge-mark.svg
 * Metaphor: trust shield + VE letter monogram (Vouch + Edge).
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
        <linearGradient id="veMarkPlate" x1="512" y1="0" x2="512" y2="1024" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#07111F" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="veMarkStroke" x1="200" y1="140" x2="820" y2="900" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A5F3FC" />
          <stop offset="45%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <linearGradient id="veMarkShieldFill" x1="512" y1="160" x2="512" y2="900" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.14" />
          <stop offset="55%" stopColor="#00E5FF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#22D3A6" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="veMarkLetter" x1="240" y1="300" x2="820" y2="760" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0FDFF" />
          <stop offset="40%" stopColor="#67E8F9" />
          <stop offset="75%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="veMarkFacet" x1="700" y1="500" x2="860" y2="560" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ECFEFF" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <radialGradient id="veMarkGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.32" />
          <stop offset="55%" stopColor="#00E5FF" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1024" height="1024" rx="224" fill="url(#veMarkPlate)" className="ve-mark-tile" />
      <circle cx="512" cy="460" r="340" fill="url(#veMarkGlow)" className="ve-mark-glow" />

      <path
        className="ve-mark-shield"
        d="M512 148
           C612 148 742 210 786 268
           V536
           C786 690 668 820 512 904
           C356 820 238 690 238 536
           V268
           C282 210 412 148 512 148 Z"
        fill="url(#veMarkShieldFill)"
        stroke="url(#veMarkStroke)"
        strokeWidth="40"
        strokeLinejoin="round"
      />

      <g className="ve-mark-letters ve-mark-identity" aria-label="VE">
        <path
          className="letter-v"
          d="M304 410
             L430 700
             L500 700
             L626 410
             L548 410
             L465 640
             L382 410
             Z"
          fill="url(#veMarkLetter)"
        />
        <g className="letter-e">
          <path d="M640 410 H692 V700 H640 Z" fill="url(#veMarkLetter)" />
          <path d="M692 410 H760 V470 H692 Z" fill="url(#veMarkLetter)" />
          <path d="M692 525 H742 V585 H692 Z" fill="url(#veMarkFacet)" />
          <path d="M692 640 H760 V700 H692 Z" fill="url(#veMarkLetter)" />
          <path
            className="ve-mark-facet letter-e-edge"
            d="M742 525 H768 L778 555 L768 585 H742 Z"
            fill="url(#veMarkFacet)"
          />
        </g>
      </g>
    </svg>
  );
}

export default VouchEdgeMark;
