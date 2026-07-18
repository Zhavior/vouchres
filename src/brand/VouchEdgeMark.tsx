/**
 * VouchEdge brand mark — vector source of truth (splash, boot, icons).
 * Geometry mirrors /public/brand/vouchedge-mark.svg
 * Metaphor: trust shield + check-V (vouch / verified edge).
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
        <linearGradient id="veMarkVouch" x1="300" y1="280" x2="760" y2="720" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0FFFF" />
          <stop offset="35%" stopColor="#67E8F9" />
          <stop offset="70%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="veMarkFacet" x1="620" y1="300" x2="780" y2="520" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ECFEFF" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <radialGradient id="veMarkGlow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.34" />
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

      <path
        className="ve-mark-seal"
        d="M512 236
           C588 236 682 280 714 322
           V520
           C714 638 626 742 512 804
           C398 742 310 638 310 520
           V322
           C342 280 436 236 512 236 Z"
        stroke="#67E8F9"
        strokeOpacity="0.28"
        strokeWidth="10"
        fill="none"
      />

      <g className="ve-mark-identity">
        <path
          d="M318 492
             L456 652
             C468 666 490 668 504 656
             L780 340
             C796 322 788 294 766 288
             C748 283 730 290 720 306
             L492 574
             L388 456
             C374 440 348 442 336 460
             C326 474 316 480 318 492 Z"
          fill="url(#veMarkVouch)"
        />
        <path
          className="ve-mark-facet"
          d="M620 420
             L766 288
             C788 294 796 322 780 340
             L640 502
             C628 516 608 512 602 496
             C598 484 606 432 620 420 Z"
          fill="url(#veMarkFacet)"
          fillOpacity="0.55"
        />
      </g>
    </svg>
  );
}

export default VouchEdgeMark;
