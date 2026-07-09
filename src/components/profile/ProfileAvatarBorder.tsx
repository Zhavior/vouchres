import React from 'react';
import { BORDER_REGISTRY, ProfileBorder } from '../../theme/themeRegistry';
import { CheckCircle2, Flame, Trophy, Sparkles, Shield, Star, Award } from 'lucide-react';

interface ProfileAvatarBorderProps {
  borderId?: string;
  avatarUrl?: string;
  displayName: string;
  initials: string;
  avatarColor?: string; // fallback bg color
  size?: 'sm' | 'md' | 'lg' | 'xl';
  winRate?: number;
  streakCount?: number;
  isVerified?: boolean;
}

export default function ProfileAvatarBorder({
  borderId,
  avatarUrl,
  displayName,
  initials,
  avatarColor = 'bg-indigo-600',
  size = 'md',
  winRate,
  streakCount,
  isVerified = false,
}: ProfileAvatarBorderProps) {
  // Resolve border
  const border = BORDER_REGISTRY.find(b => b.id === borderId) || null;

  // Determine size classes
  let containerSize = 'w-10 h-10';
  let innerSize = 'w-8 h-8';
  let borderPadding = 'p-0.5';
  let textClass = 'text-xs';
  let badgeSize = 'w-3.5 h-3.5';
  let badgePosition = '-bottom-0.5 -right-0.5';

  if (size === 'sm') {
    containerSize = 'w-8 h-8';
    innerSize = 'w-6.5 h-6.5';
    borderPadding = 'p-[1.5px]';
    textClass = 'text-[10px]';
    badgeSize = 'w-3 h-3';
    badgePosition = '-bottom-1 -right-1';
  } else if (size === 'lg') {
    containerSize = 'w-16 h-16';
    innerSize = 'w-13 h-13';
    borderPadding = 'p-[3px]';
    textClass = 'text-base';
    badgeSize = 'w-4.5 h-4.5';
    badgePosition = '-bottom-0.5 -right-0.5';
  } else if (size === 'xl') {
    containerSize = 'w-24 h-24';
    innerSize = 'w-20 h-20';
    borderPadding = 'p-1';
    textClass = 'text-2xl';
    badgeSize = 'w-6 h-6';
    badgePosition = 'bottom-0 right-0';
  }

  // Handle special border overrides
  const isPixel = border?.id?.includes('4bit') || border?.id?.includes('8bit');
  const isSquare = isPixel || borderId === '4bit-pixel-frame' || borderId === '4bit-champion-frame';

  // Render overlay icon
  const renderOverlayBadge = () => {
    if (isVerified) {
      return (
        <span className={`absolute ${badgePosition} bg-slate-950 text-sky-400 p-0.5 rounded-full border border-sky-500/30 flex items-center justify-center shadow-lg z-10`} style={{ width: badgeSize, height: badgeSize }}>
          <CheckCircle2 className="w-full h-full fill-sky-950" />
        </span>
      );
    }

    if (streakCount && streakCount >= 3) {
      return (
        <span className={`absolute ${badgePosition} bg-slate-950 text-orange-400 p-0.5 rounded-full border border-orange-500/30 flex items-center justify-center shadow-lg z-10 animate-pulse`} style={{ width: badgeSize, height: badgeSize }}>
          <Flame className="w-full h-full fill-orange-950" />
        </span>
      );
    }

    if (border?.overlayIcon) {
      return (
        <span className={`absolute ${badgePosition} bg-slate-950 text-amber-400 p-0.5 rounded-full border border-yellow-500/30 flex items-center justify-center shadow-lg text-[9px] font-black z-10 font-mono`} style={{ width: badgeSize, height: badgeSize }}>
          {border.overlayIcon}
        </span>
      );
    }

    if (winRate && winRate >= 65) {
      return (
        <span className={`absolute ${badgePosition} bg-slate-950 text-emerald-400 p-0.5 rounded-full border border-emerald-500/30 flex items-center justify-center shadow-lg z-10`} style={{ width: badgeSize, height: badgeSize }}>
          <Award className="w-full h-full fill-emerald-950" />
        </span>
      );
    }

    return null;
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${containerSize} ${isSquare ? 'rounded-none' : 'rounded-full'}`} id={`avatar-border-${borderId || 'default'}`}>
      
      {/* Actual border layer */}
      <div className={`absolute inset-0 flex items-center justify-center ${isSquare ? 'rounded-none' : 'rounded-full'} ${borderPadding} ${border?.borderClass || 'border-slate-800 border-2'}`}>
        
        {/* Avatar item */}
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={displayName} 
            referrerPolicy="no-referrer"
            loading={size === 'xl' || size === 'lg' ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={size === 'xl' ? 'high' : undefined}
            className={`w-full h-full object-cover select-none ${isSquare ? 'rounded-none' : 'rounded-full'}`}
          />
        ) : (
          <div className={`w-full h-full ${isSquare ? 'rounded-none' : 'rounded-full'} ${avatarColor} flex items-center justify-center text-white font-extrabold select-none uppercase shadow-inner ${textClass}`}>
            {initials || displayName.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Floating corner overlays */}
      {renderOverlayBadge()}

      {/* Retro 4-Bit sparkles or high capper glow */}
      {border?.animationType === 'sparkle' && (
        <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-yellow-300 animate-pulse pointer-events-none" />
      )}
    </div>
  );
}
