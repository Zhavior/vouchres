import React from 'react';
import { Sparkles } from 'lucide-react';

export function renderInnerBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="text-white font-extrabold bg-black/42 px-1 py-0.5 rounded">{part}</strong>;
    }
    return part;
  });
}

export function renderMarkdownText(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-3 font-sans max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Process title matches (e.g. ### or ####)
        if (trimmed.startsWith('###')) {
          return (
            <h4 key={idx} className="text-white text-xs font-bold font-mono tracking-wider uppercase border-l-2 border-emerald-400 pl-2 mt-4 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-vouch-emerald" />
              {trimmed.replace('###', '').replace(/\*/g, '').trim()}
            </h4>
          );
        }
        if (trimmed.startsWith('####')) {
          return (
            <h5 key={idx} className="text-white/70 text-[11px] font-bold font-mono mt-3 uppercase tracking-wide">
              ▸ {trimmed.replace('####', '').replace(/\*/g, '').trim()}
            </h5>
          );
        }
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const rawBody = trimmed.replace(/^[-* ]+/, '');
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-2">
              <span className="text-vouch-emerald font-bold mt-1 text-[9px]">■</span>
              <p className="text-xs text-white/70 leading-relaxed font-mono">
                {renderInnerBold(rawBody)}
              </p>
            </div>
          );
        }
        return (
          <p key={idx} className="text-xs text-white/70 leading-relaxed font-mono">
            {renderInnerBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
