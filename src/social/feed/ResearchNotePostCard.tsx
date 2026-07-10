import React from 'react';
import { FileText, Tag, BarChart2 } from 'lucide-react';

interface ResearchNotePostCardProps {
  researchNote: {
    tags: string[];
    gameContext?: string;
    trendData?: string;
  };
}

export default function ResearchNotePostCard({ researchNote }: ResearchNotePostCardProps) {
  return (
    <div className="bg-ve-storm rounded-xl border border-slate-800/80 p-3.5 my-2 flex flex-col gap-3.5 shadow-inner" id="research-note-card">
      <div className="flex items-center justify-between border-b border-slate-800/40 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <FileText className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-slate-300">Research Insight</span>
        </div>
        {researchNote.gameContext && (
          <span className="text-[10px] font-mono bg-indigo-950/50 text-indigo-400 border border-indigo-900/60 font-semibold px-2 py-0.5 rounded uppercase">
            Context: {researchNote.gameContext}
          </span>
        )}
      </div>

      {/* Trend data */}
      {researchNote.trendData && (
        <div className="bg-ve-surface-panel border border-slate-800/60 rounded-lg p-2.5 flex items-start gap-2">
          <BarChart2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Verified Matchup Trend</span>
            <p className="text-xs text-slate-200 mt-0.5 font-medium leading-normal">{researchNote.trendData}</p>
          </div>
        </div>
      )}

      {/* Tags list */}
      {researchNote.tags && researchNote.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5" id="research-note-tags-container">
          <Tag className="w-3 h-3 text-slate-500" />
          {researchNote.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] bg-slate-900 text-slate-400 hover:text-sky-400 cursor-pointer transition-colors px-2 py-0.5 rounded border border-slate-800/80 font-mono"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
