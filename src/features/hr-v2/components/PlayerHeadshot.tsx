import React, { useState } from 'react';
import { getMlbHeadshotUrl, getPlayerInitials } from '../../../lib/mlbHeadshot';

interface PlayerHeadshotProps {
  mlbId?: string | number | null;
  name: string;
  size?: number; // width/height in px (default 40)
}

export function PlayerHeadshot({ mlbId, name, size = 40 }: PlayerHeadshotProps) {
  const [hasError, setHasError] = useState(false);
  const headshotUrl = getMlbHeadshotUrl(mlbId, size * 2);

  const style = {
    width: `${size}px`,
    height: `${size}px`,
  };

  if (!headshotUrl || hasError) {
    const initials = getPlayerInitials(name);
    return (
      <div
        style={style}
        className="rounded-full ring-1 ring-emerald-500/30 bg-slate-900 text-slate-300 font-mono font-bold flex items-center justify-center text-xs shrink-0 select-none shadow-inner"
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      style={style}
      className="rounded-full ring-1 ring-emerald-500/30 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative group select-none"
    >
      <img
        src={headshotUrl}
        alt={name}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain object-[center_20%] scale-95 transition-transform duration-200 group-hover:scale-100"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
