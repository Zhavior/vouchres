import React, { useMemo, useState } from 'react';
import { Sliders, AlertTriangle, CheckCircle2, XCircle, Clock, Sparkles, ChevronDown, ChevronUp, Lock, ExternalLink, Layers3 } from 'lucide-react';
import { Parlay } from '../../types';
import { formatFeedLockTimestamp } from '../../lib/parlayLockPolicy';
import { projectSmartParlayFromParlay } from '../../domain/parlay';
import { resolvePublicProofPickId, resolveLocalSlipId } from '../../lib/parlays/parlayProofLinks';
import SmartParlayLegCard from '../../components/parlay/smart/SmartParlayLegCard';

interface ParlayFeedPostCardProps {
  parlay: Parlay;
}

export default function ParlayFeedPostCard({ parlay }: ParlayFeedPostCardProps) {
  const [showEdgeReport, setShowEdgeReport] = useState(false);
  const lockLabel = formatFeedLockTimestamp(parlay.feedLockedAt);
  const smartSlip = useMemo(() => projectSmartParlayFromParlay(parlay), [parlay]);
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
        return <strong key={i} className="text-white font-extrabold bg-ve-surface-panel/70 px-1 py-0.5 rounded">{part}</strong>;
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
    <div className="bg-ve-graphite rounded-xl border border-slate-800/80 overflow-hidden shadow-inner my-2" id={`parlay-ticket-${parlay.id}`}>
      <div className="bg-ve-storm px-4 py-3 border-b border-slate-800/85 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-slate-100 text-xs tracking-wide uppercase">{parlay.title || 'Slip Selection'}</span>
        </div>
        <div className="flex items-center gap-2">
          {lockLabel && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-cyan-950/40 text-cyan-300 border-cyan-800/50 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              LOCKED {lockLabel}
            </span>
          )}
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getRiskColor(parlay.riskTier)}`}>
            {parlay.riskTier} RISK
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusBadgeClass(parlay.status)}`}>
            {getStatusIcon(parlay.status)}
            {parlay.status}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">
          <Layers3 className="w-3.5 h-3.5" />
          ParlayOS Slip
        </div>
        {smartSlip.legs.map((leg) => {
          const sourceLeg = parlay.legs.find((item) => item.id === leg.id);
          return (
            <SmartParlayLegCard
              key={leg.id}
              leg={leg}
              odds={sourceLeg?.odds}
              compact
            />
          );
        })}
      </div>

      <div className="bg-ve-storm/50 px-4 py-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono font-bold">
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

      {parlay.edgeReport && (
        <div className="border-t border-slate-800/80 bg-ve-graphite/80">
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
            <div className="p-4 border-t border-slate-900/65 bg-ve-graphite/90 space-y-3 animate-fade-in text-left">
              <div className="text-[10px] text-slate-500 font-mono font-semibold flex items-center justify-between border-b border-slate-905 pb-1.5 mb-2">
                <span>Vouchedge AI-3.5 Engine Analysis</span>
                <span>Verified Integrity Protocol v3.2</span>
              </div>
              {renderMarkdownText(parlay.edgeReport)}
            </div>
          )}
        </div>
      )}

      <div className="bg-rose-950/20 px-4 py-1.5 border-t border-rose-950/30 flex items-center justify-between gap-2">
        <p className="text-[9px] text-rose-450 leading-none flex items-center justify-center gap-1 uppercase tracking-wider font-semibold">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          No guaranteed wins. Keep wagering standard.
        </p>
        {proofPickId ? (
          <a
            href={`/p/${encodeURIComponent(proofPickId)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-mono font-black uppercase text-vouch-cyan hover:text-cyan-300 flex items-center gap-1 shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            View proof
          </a>
        ) : null}
      </div>
    </div>
  );
}
