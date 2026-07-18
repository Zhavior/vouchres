/**
 * VouchEdge brand mark — enamel shield + bone VE on graphite ink.
 * Mirrors /public/brand/vouchedge-mark.svg
 */
import React from 'react';

export type VouchEdgeMarkProps = {
  size?: number | string;
  className?: string;
  variant?: 'boot' | 'idle' | 'static';
  title?: string;
};

const SHIELD_D =
  'M512 168 C602 168 718 222 760 274 V530 C760 668 652 798 512 868 C372 798 264 668 264 530 V274 C306 222 422 168 512 168 Z';

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
      data-material="enamel"
      data-palette="ink-desk"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="veMarkPlate" x1="180" y1="0" x2="860" y2="1024" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A2330" />
          <stop offset="42%" stopColor="#121820" />
          <stop offset="100%" stopColor="#0B1016" />
        </linearGradient>
        <linearGradient id="veMarkPlateSheen" x1="200" y1="80" x2="820" y2="900" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2A3A48" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#2A3A48" stopOpacity="0" />
          <stop offset="100%" stopColor="#0E3D38" stopOpacity="0.18" />
        </linearGradient>
        <radialGradient id="veMarkGlow" cx="48%" cy="40%" r="52%">
          <stop offset="0%" stopColor="#2A9D8F" stopOpacity="0.10" />
          <stop offset="55%" stopColor="#1B4332" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#0B1016" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="veMarkShieldFill" x1="512" y1="170" x2="520" y2="860" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1F6F66" />
          <stop offset="38%" stopColor="#145A52" />
          <stop offset="72%" stopColor="#0E3F3A" />
          <stop offset="100%" stopColor="#0A2E2B" />
        </linearGradient>
        <linearGradient id="veMarkShieldInner" x1="400" y1="220" x2="640" y2="720" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5EEAD4" stopOpacity="0.16" />
          <stop offset="45%" stopColor="#2A9D8F" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#041F1C" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="veMarkStroke" x1="280" y1="160" x2="740" y2="860" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E7F6F2" />
          <stop offset="28%" stopColor="#9BD5C8" />
          <stop offset="62%" stopColor="#4FA896" />
          <stop offset="100%" stopColor="#2F6F63" />
        </linearGradient>
        <linearGradient id="veMarkLetter" x1="360" y1="400" x2="680" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF8EF" />
          <stop offset="48%" stopColor="#F0E6D6" />
          <stop offset="100%" stopColor="#C9DED7" />
        </linearGradient>
        <linearGradient id="veMarkLetterShade" x1="512" y1="410" x2="512" y2="590" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#0A2E2B" stopOpacity="0.18" />
        </linearGradient>
        <filter id="veMarkGrain" x="-10%" y="-10%" width="120%" height="120%" filterUnits="objectBoundingBox">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.85  0 0 0 0 0.9  0 0 0 0 0.88  0 0 0 0.055 0"
            in="n"
            result="g"
          />
          <feBlend in="SourceGraphic" in2="g" mode="overlay" />
        </filter>
        <filter id="veMarkLetterDepth" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.2" floodColor="#041F1C" floodOpacity="0.45" />
        </filter>
        <clipPath id="veMarkShieldClip">
          <path d={SHIELD_D} />
        </clipPath>
      </defs>

      <rect width="1024" height="1024" rx="224" fill="url(#veMarkPlate)" className="ve-mark-tile" />
      <rect width="1024" height="1024" rx="224" fill="url(#veMarkPlateSheen)" />
      <rect
        width="1024"
        height="1024"
        rx="224"
        fill="url(#veMarkPlate)"
        filter="url(#veMarkGrain)"
        opacity="0.55"
        className="ve-mark-grain"
      />
      <ellipse cx="512" cy="455" rx="310" ry="280" fill="url(#veMarkGlow)" className="ve-mark-glow" />

      <path
        className="ve-mark-shield"
        d={SHIELD_D}
        fill="url(#veMarkShieldFill)"
        stroke="url(#veMarkStroke)"
        strokeWidth="30"
        strokeLinejoin="round"
      />
      <g clipPath="url(#veMarkShieldClip)">
        <path d={SHIELD_D} fill="url(#veMarkShieldInner)" />
        <ellipse cx="512" cy="250" rx="168" ry="54" fill="#E7F6F2" opacity="0.10" />
      </g>

      <g
        className="ve-mark-letters ve-mark-identity ve-mark-optical"
        aria-label="VE"
        filter="url(#veMarkLetterDepth)"
      >
        <path className="letter-v" d="M460.23 575L409.19 575L344.07 421L399.95 421L436.69 510.98L474.31 421L525.35 421" fill="url(#veMarkLetter)" />
        <path className="letter-e" d="M679.93 575L551.89 575L551.89 421L677.07 421L677.07 460.16L602.93 460.16L602.93 478.20L668.05 478.20L668.05 515.60L602.93 515.60L602.93 535.84L679.93 535.84" fill="url(#veMarkLetter)" />
        <path className="letter-v" d="M460.23 575L409.19 575L344.07 421L399.95 421L436.69 510.98L474.31 421L525.35 421" fill="url(#veMarkLetterShade)" opacity="0.55" />
        <path className="letter-e" d="M679.93 575L551.89 575L551.89 421L677.07 421L677.07 460.16L602.93 460.16L602.93 478.20L668.05 478.20L668.05 515.60L602.93 515.60L602.93 535.84L679.93 535.84" fill="url(#veMarkLetterShade)" opacity="0.55" />
      </g>
    </svg>
  );
}

export default VouchEdgeMark;
