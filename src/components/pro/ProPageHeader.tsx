import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { ACCENT, withAlpha } from '../../theme/colors';

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

      <div className="ve-premium-panel relative flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {badge && (
            <div
              className="mb-3 inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]"
              style={{ color: accent, borderColor: withAlpha(accent, 0.26), background: withAlpha(accent, 0.08) }}
            >
              {badge}
            </div>
          )}
          <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-[hsl(var(--ve-text-primary))] sm:text-2xl">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl border"
              style={{ borderColor: withAlpha(accent, 0.30), background: withAlpha(accent, 0.10) }}
            >
              <Icon className="h-4 w-4" style={{ color: accent }} />
            </span>
            {title}
          </h1>
          {subtitle && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[hsl(var(--ve-text-secondary))]">{subtitle}</p>}
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
                className="ve-card-compact relative overflow-hidden px-3 py-2.5"
                style={{ borderColor: withAlpha(tileAccent, 0.24) }}
              >
                <span
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${withAlpha(tileAccent, 0.45)}, transparent)` }}
                />
                <div className="flex items-center gap-2">
                  {TileIcon && (
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-md border"
                      style={{ borderColor: withAlpha(tileAccent, 0.30), background: withAlpha(tileAccent, 0.08) }}
                    >
                      <TileIcon className="h-3 w-3" style={{ color: tileAccent }} />
                    </span>
                  )}
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[hsl(var(--ve-text-muted))]">
                    {tile.label}
                  </span>
                </div>
                <p className="mt-1.5 font-mono text-base font-black" style={{ color: tileAccent }}>
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
