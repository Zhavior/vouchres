/**
 * VouchEdge brand mark — night-city shield + geometric white VE.
 * Mirrors /public/brand/vouchedge-mark.svg (SOCIALIZE ref palette).
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
  const spatialClass =
    variant === 'boot'
      ? 've-mark-spatial ve-mark-spatial--boot'
      : variant === 'idle'
        ? 've-mark-spatial ve-mark-spatial--idle'
        : 've-mark-spatial ve-mark-spatial--static';

  return (
    <span className={spatialClass} style={{ width: dim, height: dim }}>
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
      data-material="night-city"
      data-palette="socialize-ref"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="veMarkPlate" x1="120" y1="0" x2="900" y2="1024" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2B1F54" />
          <stop offset="40%" stopColor="#1A1035" />
          <stop offset="100%" stopColor="#0B0618" />
        </linearGradient>
        <radialGradient id="veMarkHaze" cx="78%" cy="22%" r="48%">
          <stop offset="0%" stopColor="#C026D3" stopOpacity="0.38" />
          <stop offset="55%" stopColor="#7C3AED" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#0B0618" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="veMarkGlow" cx="42%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.28" />
          <stop offset="40%" stopColor="#0891B2" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0B0618" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="veMarkAmber" cx="62%" cy="58%" r="28%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="veMarkShieldFill" x1="512" y1="170" x2="520" y2="860" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4C1D95" />
          <stop offset="45%" stopColor="#2E1065" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
        <linearGradient id="veMarkShieldInner" x1="360" y1="220" x2="680" y2="760" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.18" />
          <stop offset="40%" stopColor="#A855F7" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#0B0618" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="veMarkStroke" x1="260" y1="160" x2="760" y2="860" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0F7FA" />
          <stop offset="35%" stopColor="#67E8F9" />
          <stop offset="70%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="veMarkLetter" x1="360" y1="400" x2="680" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#CFFAFE" />
        </linearGradient>
        <linearGradient id="veMarkLetterShade" x1="512" y1="410" x2="512" y2="590" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.12" />
        </linearGradient>
        <filter id="veMarkGrain" x="-10%" y="-10%" width="120%" height="120%" filterUnits="objectBoundingBox">
          <feTurbulence type="fractalNoise" baseFrequency="1.25" numOctaves="3" seed="19" result="n" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.7  0 0 0 0 0.55  0 0 0 0 0.9  0 0 0 0.045 0" in="n" result="g" />
          <feBlend in="SourceGraphic" in2="g" mode="soft-light" />
        </filter>
        <filter id="veMarkLetterDepth" x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#22D3EE" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#0B0618" floodOpacity="0.55" />
        </filter>
        <clipPath id="veMarkShieldClip">
          <path d={SHIELD_D} />
        </clipPath>
      </defs>

      <rect width="1024" height="1024" rx="224" fill="url(#veMarkPlate)" className="ve-mark-tile" />
      <rect width="1024" height="1024" rx="224" fill="url(#veMarkHaze)" />
      <ellipse cx="430" cy="560" rx="340" ry="300" fill="url(#veMarkGlow)" className="ve-mark-glow" />
      <ellipse cx="620" cy="580" rx="200" ry="170" fill="url(#veMarkAmber)" />
      <rect width="1024" height="1024" rx="224" fill="url(#veMarkPlate)" filter="url(#veMarkGrain)" opacity="0.5" className="ve-mark-grain" />

      <path className="ve-mark-shield" d={SHIELD_D} fill="url(#veMarkShieldFill)" stroke="url(#veMarkStroke)" strokeWidth="30" strokeLinejoin="round" />
      <g clipPath="url(#veMarkShieldClip)">
        <path d={SHIELD_D} fill="url(#veMarkShieldInner)" />
        <ellipse cx="512" cy="245" rx="170" ry="56" fill="#E0F7FA" opacity="0.12" />
      </g>

      <g className="ve-mark-letters ve-mark-identity ve-mark-optical" aria-label="VE" filter="url(#veMarkLetterDepth)">
        <path className="letter-v" d="M448.95 563.52L425.47 563.52L349.57 432.48L382.33 432.48L437.3 527.67L492.26 432.48L524.84 432.48" fill="url(#veMarkLetter)" />
        <path className="letter-e" d="M674.43 563.52L553.4 563.52L553.4 432.48L674.43 432.48L674.43 460.87L581.97 460.87L581.97 483.80L656.41 483.80L656.41 512.20L581.97 512.20L581.97 535.13L674.43 535.13" fill="url(#veMarkLetter)" />
        <path className="letter-v" d="M448.95 563.52L425.47 563.52L349.57 432.48L382.33 432.48L437.3 527.67L492.26 432.48L524.84 432.48" fill="url(#veMarkLetterShade)" opacity="0.5" />
        <path className="letter-e" d="M674.43 563.52L553.4 563.52L553.4 432.48L674.43 432.48L674.43 460.87L581.97 460.87L581.97 483.80L656.41 483.80L656.41 512.20L581.97 512.20L581.97 535.13L674.43 535.13" fill="url(#veMarkLetterShade)" opacity="0.5" />
      </g>
    </svg>
    </span>
  );
}

export default VouchEdgeMark;
