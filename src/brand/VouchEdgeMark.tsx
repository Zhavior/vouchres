/**
 * VouchEdge brand mark — oversized Star Wars outline VE BEHIND the trust shield.
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
      data-letter-style="starwars-outline"
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
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="veMarkLetter" x1="260" y1="300" x2="780" y2="720" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FEFF" />
          <stop offset="40%" stopColor="#67E8F9" />
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

      <g
        className="ve-mark-letters ve-mark-identity ve-mark-optical ve-mark-starwars"
        aria-label="VE"
        fill="none"
        stroke="url(#veMarkLetter)"
        strokeWidth="48"
        strokeLinejoin="miter"
        strokeLinecap="square"
        strokeMiterlimit={2}
      >
        <path className="letter-v" d="M280 320 L456 700 L632 320" />
        <path
          className="letter-e"
          d="M560 320 V700
             M560 320 H760
             M560 510 H720
             M560 700 H760"
        />
      </g>

      <path
        className="ve-mark-shield"
        d="M512 168
           C602 168 718 222 760 274
           V530
           C760 668 652 798 512 868
           C372 798 264 668 264 530
           V274
           C306 222 422 168 512 168 Z"
        fill="url(#veMarkShieldFill)"
        stroke="url(#veMarkStroke)"
        strokeWidth="34"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default VouchEdgeMark;
