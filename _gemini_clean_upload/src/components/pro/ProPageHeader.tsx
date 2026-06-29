import React from 'react';
import { ShieldCheck } from 'lucide-react';

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
  accent = '#38bdf8',
  kpiTiles = [],
  right,
}) {
  return (
    <div className="relative mb-4">
      <div
        className="pointer-events-none absolute inset-x-0 -top-4 h-24"
        style={{ background: `linear-gradient(to bottom, ${accent}11, transparent)` }}
      />

      <div className="relative flex flex-col gap-3 rounded-3xl border border-sky-400/15 bg-gradient-to-br from-slate-950 via-slate-950 to-sky-950/30 p-5 shadow-[0_0_50px_rgba(14,165,233,0.08)] sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {badge && (
            <div
              className="mb-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider"
              style={{ color: accent, borderColor: accent + '33', background: accent + '12' }}
            >
              {badge}
            </div>
          )}
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-white">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl border"
              style={{ borderColor: accent + '40', background: accent + '14' }}
            >
              <Icon className="h-4 w-4" style={{ color: accent }} />
            </span>
            {title}
          </h1>
          {subtitle && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{subtitle}</p>}
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
                className="relative overflow-hidden rounded-xl border bg-slate-900/50 px-3 py-2.5"
                style={{ borderColor: tileAccent + '33' }}
              >
                <span
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${tileAccent}66, transparent)` }}
                />
                <div className="flex items-center gap-2">
                  {TileIcon && (
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-md border"
                      style={{ borderColor: tileAccent + '40', background: tileAccent + '12' }}
                    >
                      <TileIcon className="h-3 w-3" style={{ color: tileAccent }} />
                    </span>
                  )}
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
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
