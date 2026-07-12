import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Sparkles } from 'lucide-react';
import { Parlay } from '../../types';
import { projectSmartParlayFromParlay } from '../../domain/parlay';
import { resolvePublicProofPickId, resolveLocalSlipId } from '../../lib/parlays/parlayProofLinks';
import SmartParlaySlipCard from '../../components/parlay/smart/SmartParlaySlipCard';

interface ParlayFeedPostCardProps {
  parlay: Parlay;
}

export default function ParlayFeedPostCard({ parlay }: ParlayFeedPostCardProps) {
  const [showEdgeReport, setShowEdgeReport] = useState(false);
  const smartSlip = useMemo(() => projectSmartParlayFromParlay(parlay), [parlay]);
  const legOdds = useMemo(
    () => Object.fromEntries(parlay.legs.map((leg) => [leg.id, leg.odds])),
    [parlay.legs],
  );
  const proofPickId =
    resolvePublicProofPickId({
      backendPickId: parlay.backendPickId,
      sourceId: parlay.id,
      id: parlay.id,
    }) ?? resolveLocalSlipId({ sourceId: parlay.id, id: parlay.id });

  const renderInnerBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-white font-extrabold bg-white/5 px-1 py-0.5 rounded">{part}</strong>;
      }
      return part;
    });
  };

  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar text-left font-sans text-xs">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          if (trimmed.startsWith('###')) {
            return (
              <h4 key={idx} className="text-white text-xs font-bold font-mono tracking-wider uppercase border-l-2 border-emerald-400 pl-2 mt-3 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {trimmed.replace('###', '').replace(/\*/g, '').trim()}
              </h4>
            );
          }
          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const rawBody = trimmed.replace(/^[-* ]+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 ml-1">
                <span className="text-emerald-400 font-bold mt-1 text-[8px]">■</span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  {renderInnerBold(rawBody)}
                </p>
              </div>
            );
          }
          return (
            <p key={idx} className="text-slate-300 leading-relaxed pl-1 font-mono text-[11px]">
              {renderInnerBold(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="my-2 space-y-2" id={`parlay-ticket-${parlay.id}`}>
      <SmartParlaySlipCard
        slip={smartSlip}
        variant="feed"
        legVariant="pro"
        maxLegs={99}
        showTrustPanel={false}
        showOsBadges
        legOdds={legOdds}
        metaLine={`${parlay.riskTier ?? "MEDIUM"} risk · ${parlay.bookie || "EXCHANGE"} · ${parlay.totalOdds}`}
        footerNote="Probability-based research — not betting advice."
      />

      {parlay.edgeReport ? (
        <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowEdgeReport(!showEdgeReport)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-emerald-400 hover:bg-emerald-950/10 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Edge report ({parlay.edgeScore}% confidence)</span>
            </div>
            {showEdgeReport ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showEdgeReport ? (
            <div className="p-4 border-t border-white/10 space-y-3">
              {renderMarkdownText(parlay.edgeReport)}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-[9px] text-rose-300/80 flex items-center gap-1 uppercase tracking-wider font-semibold">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          No guaranteed wins
        </p>
        {proofPickId ? (
          <a
            href={`/p/${encodeURIComponent(proofPickId)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-mono font-black uppercase text-cyan-300 hover:text-cyan-200 flex items-center gap-1 shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            View proof
          </a>
        ) : null}
      </div>
    </div>
  );
}
