/**
 * VouchEdge brand mark — trust shield + filled VE type.
 * Mirrors /public/brand/vouchedge-mark.svg (font-outlined paths).
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
      data-mark-core="ve"
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
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="veMarkLetter" x1="300" y1="300" x2="740" y2="740" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FEFF" />
          <stop offset="45%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        <radialGradient id="veMarkGlow" cx="50%" cy="42%" r="46%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.14" />
          <stop offset="70%" stopColor="#00E5FF" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1024" height="1024" rx="224" fill="url(#veMarkPlate)" className="ve-mark-tile" />
      <circle cx="512" cy="468" r="300" fill="url(#veMarkGlow)" className="ve-mark-glow" />

      <path
        className="ve-mark-shield"
        d="M512 168 C602 168 718 222 760 274 V530 C760 668 652 798 512 868 C372 798 264 668 264 530 V274 C306 222 422 168 512 168 Z"
        fill="url(#veMarkShieldFill)"
        stroke="url(#veMarkStroke)"
        strokeWidth="32"
        strokeLinejoin="round"
      />

      <g className="ve-mark-letters ve-mark-identity ve-mark-optical" aria-label="VE" fill="url(#veMarkLetter)">
        <path className="letter-v" d="M467.6 577.80L414.71 577.80L347.22 418.20L405.13 418.20L443.21 511.45L482.19 418.20L535.09 418.2" />
        <path className="letter-e" d="M676.78 577.80L544.09 577.80L544.09 418.20L673.82 418.20L673.82 458.78L596.98 458.78L596.98 477.48L664.47 477.48L664.47 516.24L596.98 516.24L596.98 537.22L676.78 537.22" />
      </g>
    </svg>
  );
}

export default VouchEdgeMark;
