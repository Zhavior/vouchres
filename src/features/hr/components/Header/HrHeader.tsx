import type { HrWatchMode } from '../../types/hrWatch';
import { Columns, Table } from 'lucide-react';

interface HrHeaderProps {
  viewMode: 'cards' | 'spreadsheet';
  onViewModeChange: (mode: 'cards' | 'spreadsheet') => void;
  mode: HrWatchMode;
}

export function HrHeader({ viewMode, onViewModeChange, mode }: HrHeaderProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#081124]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.32em] text-slate-400">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#FACC15]">🔥</span>
            HOME RUN INTELLIGENCE
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-100 sm:text-4xl">Premium MLB home run research</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-400">
              A fast, explainable HR board built on existing data feeds. Switch between compact cards and a sticky spreadsheet for the same live player universe.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              viewMode === 'cards'
                ? 'border-[#FACC15] bg-[#FACC15]/10 text-slate-100 shadow-[0_12px_24px_rgba(250,204,21,0.14)]'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <Columns className="h-4 w-4" />
            Cards
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('spreadsheet')}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              viewMode === 'spreadsheet'
                ? 'border-[#3B82F6] bg-[#3B82F6]/10 text-slate-100 shadow-[0_12px_24px_rgba(59,130,246,0.14)]'
                : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <Table className="h-4 w-4" />
            Spreadsheet
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-slate-500">
        <div className="flex flex-wrap gap-4">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Data mode: {mode === 'confirmed' ? 'Confirmed' : mode === 'curated' ? 'Preview' : mode === 'all' ? 'All Projected' : 'Blocked'}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Live HR universe</span>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
}
