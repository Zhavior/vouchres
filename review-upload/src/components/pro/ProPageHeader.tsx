import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { ACCENT, withAlpha } from '../../theme/colors';
import { Z8_ICON_BOX, Z8_LABEL, Z8_PANEL } from '../../theme/z8Tokens';

export interface ProKpiTile {
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  accent?: string;
}

export interface ProPageHeaderProps {
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle?: string;
  badge?: string;
  accent?: string;
  kpiTiles?: ProKpiTile[];
  right?: React.ReactNode;
}

export const ProPageHeader: React.FC<ProPageHeaderProps> = React.memo(function ProPageHeader({
  icon: Icon = ShieldCheck,
  title,
  subtitle,
  badge,
  accent = ACCENT.matchup,
  kpiTiles = [],
  right,
}) {
  return (
    <div className="relative mb-4">
      <div
        className="pointer-events-none absolute inset-x-0 -top-4 h-20"
        style={{ background: `linear-gradient(to bottom, ${withAlpha(accent, 0.10)}, transparent)` }}
      />

      <div className={`${Z8_PANEL} ve-premium-panel relative flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between`}>
        <div className="min-w-0">
          {badge && (
            <div className={`mb-3 inline-flex border border-vouch-cyan/25 bg-vouch-cyan/10 px-2.5 py-1 ${Z8_LABEL} text-vouch-cyan`}>
              {badge}
            </div>
          )}
          <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-white sm:text-2xl font-mono uppercase">
            <span className={`h-8 w-8 ${Z8_ICON_BOX}`}>
              <Icon className="h-4 w-4 text-vouch-cyan" />
            </span>
            {title}
          </h1>
          {subtitle && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55 font-mono">{subtitle}</p>}
        </div>
        {right}
      </div>

      {kpiTiles.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {kpiTiles.map((tile, idx) => {
            const TileIcon = tile.icon;
            const tileAccent = tile.accent ?? accent;
            return (
              <div
                key={`${tile.label}-${idx}`}
                className={`${Z8_PANEL} ve-card-compact relative overflow-hidden px-3 py-2.5`}
              >
                <span
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-vouch-cyan/45 to-transparent"
                />
                <div className="flex items-center gap-2">
                  {TileIcon && (
                    <span className={`h-6 w-6 ${Z8_ICON_BOX}`}>
                      <TileIcon className="h-3 w-3 text-vouch-cyan" />
                    </span>
                  )}
                  <span className={`${Z8_LABEL} text-white/40`}>
                    {tile.label}
                  </span>
                </div>
                <p className="mt-1.5 font-mono text-base font-black text-vouch-cyan">
                  {tile.value}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default ProPageHeader;
