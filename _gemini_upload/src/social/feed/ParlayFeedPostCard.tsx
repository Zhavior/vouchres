import React, { useState } from 'react';
import { Sliders, AlertTriangle, CheckCircle2, XCircle, Clock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Parlay } from '../../types';

interface ParlayFeedPostCardProps {
  parlay: Parlay;
}

export default function ParlayFeedPostCard({ parlay }: ParlayFeedPostCardProps) {
  const [showEdgeReport, setShowEdgeReport] = useState(false);

  const renderInnerBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-white font-extrabold bg-[#1e293b]/70 px-1 py-0.5 rounded">{part}</strong>;
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
          if (trimmed.startsWith('####')) {
            return (
              <h5 key={idx} className="text-slate-350 text-[10px] font-bold font-mono mt-2.5 uppercase tracking-wide">
                ▸ {trimmed.replace('####', '').replace(/\*/g, '').trim()}
              </h5>
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

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case 'LOW':
        return 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40';
      case 'MEDIUM':
        return 'bg-amber-950/50 text-amber-400 border-amber-800/40';
      case 'HIGH':
        return 'bg-rose-950/50 text-rose-400 border-rose-800/40';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WON':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'LOST':
        return <XCircle className="w-4 h-4 text-rose-450" />;
      case 'VOID':
        return <AlertTriangle className="w-4 h-4 text-slate-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-400 animate-pulse" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'WON':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'LOST':
        return 'bg-rose-950 text-rose-400 border-rose-900';
      case 'VOID':
        return 'bg-slate-900 text-slate-400 border-slate-800';
      default:
        return 'bg-amber-950/80 text-amber-500 border-amber-900/50';
    }
  };

  return (
    <div className="bg-[#0b0f19] rounded-xl border border-slate-800/80 overflow-hidden shadow-inner my-2" id={`parlay-ticket-${parlay.id}`}>
      {/* Ticket Header */}
      <div className="bg-[#121824] px-4 py-3 border-b border-slate-800/85 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-slate-100 text-xs tracking-wide uppercase">{parlay.title || 'Slip Selection'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getRiskColor(parlay.riskTier)}`}>
            {parlay.riskTier} RISK
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusBadgeClass(parlay.status)}`}>
            {getStatusIcon(parlay.status)}
            {parlay.status}
          </span>
        </div>
      </div>

      {/* Parlay Legs list */}
      <div className="p-3.5 space-y-3 divide-y divide-slate-800/60">
        {parlay.legs.map((leg) => {
          return (
            <div key={leg.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs" id={`leg-item-${leg.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] bg-slate-850 text-slate-300 px-1.5 py-0.2 rounded font-semibold uppercase">{leg.sport}</span>
                  <span className="text-slate-400 font-medium truncate max-w-[170px] xl:max-w-xs">{leg.game}</span>
                </div>
                <h5 className="font-bold text-slate-200">{leg.selection}</h5>
                <p className="text-slate-400 text-[10px]">{leg.market}</p>
              </div>

              <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                <span className="font-mono text-sky-400 font-bold bg-sky-950/30 px-1.5 py-0.5 rounded">
                  {leg.odds > 0 && leg.odds < 100 ? `x${leg.odds.toFixed(2)}` : leg.odds}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                  {getStatusIcon(leg.status)}
                  {leg.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ticket Footer / Summary */}
      <div className="bg-[#121824]/50 px-4 py-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono font-bold">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 text-[10px]">BOOK:</span>
          <span className="text-slate-300 font-semibold bg-slate-850 px-1.5 py-0.5 rounded uppercase text-[9px]">{parlay.bookie || 'EXCHANGE'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-200">
          <span className="text-slate-400 font-mono text-[10px]">TOTAL ODDS:</span>
          <span className="text-emerald-400 font-bold text-sm bg-emerald-950/50 border border-emerald-800/30 px-2 py-0.5 rounded">
            {parlay.totalOdds}
          </span>
        </div>
      </div>

      {/* Dynamic Collapsible AI Edge Report */}
      {parlay.edgeReport && (
        <div className="border-t border-slate-800/80 bg-[#0d1322]/80">
          <button
            onClick={() => setShowEdgeReport(!showEdgeReport)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-emerald-400 hover:bg-emerald-950/10 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>SABERMETRIC EDGE REPORT ({parlay.edgeScore}% CONFIDENCE)</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span>{showEdgeReport ? 'Collapse' : 'Expand Report'}</span>
              {showEdgeReport ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>
          
          {showEdgeReport && (
            <div className="p-4 border-t border-slate-900/65 bg-[#070b14]/90 space-y-3 animate-fade-in text-left">
              <div className="text-[10px] text-slate-500 font-mono font-semibold flex items-center justify-between border-b border-slate-905 pb-1.5 mb-2">
                <span>Vouchedge AI-3.5 Engine Analysis</span>
                <span>Verified Integrity Protocol v3.2</span>
              </div>
              {renderMarkdownText(parlay.edgeReport)}
            </div>
          )}
        </div>
      )}

      {/* Safety Legal Warning */}
      <div className="bg-rose-950/20 px-4 py-1.5 border-t border-rose-950/30 text-center">
        <p className="text-[9px] text-rose-450 leading-none flex items-center justify-center gap-1 uppercase tracking-wider font-semibold">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          No guaranteed wins. Keep wagering standard.
        </p>
      </div>
    </div>
  );
}
