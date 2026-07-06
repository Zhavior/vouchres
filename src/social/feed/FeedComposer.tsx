import React from 'react';
import { CheckCircle2, Lock, Send, Sparkles, TrendingUp, Trophy, FileText } from 'lucide-react';
import { FeedPost, Parlay } from '../../types';

type ComposerMode = 'VOUCH' | 'PARLAY' | 'RESULT' | 'RESEARCH_NOTE';

interface FeedComposerProps {
  onPostCreated: (postData: Partial<FeedPost>) => void;
  savedSlips: Parlay[];
  profileName: string;
}

const MODES: Array<{
  id: ComposerMode;
  label: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'VOUCH', label: 'Pick', helper: 'Single edge', icon: Sparkles },
  { id: 'PARLAY', label: 'Parlay', helper: 'Attach slip', icon: TrendingUp },
  { id: 'RESULT', label: 'Result', helper: 'Log outcome', icon: Trophy },
  { id: 'RESEARCH_NOTE', label: 'Research', helper: 'Slate read', icon: FileText },
];

export default function FeedComposer({ onPostCreated, savedSlips, profileName }: FeedComposerProps) {
  const [mode, setMode] = React.useState<ComposerMode>('VOUCH');
  const [content, setContent] = React.useState('');
  const [sport, setSport] = React.useState('MLB');
  const [market, setMarket] = React.useState('');
  const [odds, setOdds] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [selectedSlipId, setSelectedSlipId] = React.useState('');
  const [isPosting, setIsPosting] = React.useState(false);

  const maxChars = 360;
  const remaining = maxChars - content.length;
  const canPost = content.trim().length >= 3 && remaining >= 0 && !isPosting;
  const initials = (profileName || 'VE')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const marketLabel =
    mode === 'RESULT' ? 'Result market' : mode === 'RESEARCH_NOTE' ? 'Game context' : mode === 'PARLAY' ? 'Saved slip' : 'Market / game';
  const marketPlaceholder =
    mode === 'VOUCH'
      ? 'Yankees vs Red Sox · Judge HR'
      : mode === 'RESULT'
        ? 'Kyle Schwarber HR result'
        : 'Game, player, or angle';
  const oddsLabel = mode === 'RESULT' ? 'Units' : mode === 'RESEARCH_NOTE' ? 'Trend note' : 'Odds / trend';

  const reset = () => {
    setContent('');
    setMarket('');
    setOdds('');
    setTags('');
    setSelectedSlipId('');
    setMode('VOUCH');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPost) return;

    const selectedSlip = savedSlips.find((slip) => slip.id === selectedSlipId);
    const parsedTags = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

    setIsPosting(true);

    const postData: Partial<FeedPost> = {
      content: content.trim(),
      postType: mode,
      sportBadge: sport,
      sourceBadge: 'Community',
      isVerified: false,
    };

    if (mode === 'VOUCH') {
      postData.vouch = {
        id: `vouch-${Date.now()}`,
        vouchSource: profileName || 'VouchEdge',
        userNote: content.trim(),
        sport,
        gameName: market.trim() || 'Today slate',
        market: market.trim() || 'Community pick',
        odds: odds.trim() || '—',
        status: 'PENDING',
        savedCount: 0,
        vouchedCount: 1,
        createdAt: new Date().toISOString(),
      };
    }

    if (mode === 'PARLAY' && selectedSlip) {
      postData.parlay = selectedSlip;
    }

    if (mode === 'RESULT') {
      postData.result = {
        status: 'WON',
        units: Number.parseFloat(odds) || 1,
        profit: Number.parseFloat(odds) || 1,
        marketName: market.trim() || 'Result update',
        details: content.trim(),
      };
    }

    if (mode === 'RESEARCH_NOTE') {
      postData.researchNote = {
        tags: parsedTags.length ? parsedTags : ['#Research'],
        gameContext: market.trim() || undefined,
        trendData: odds.trim() || undefined,
      };
    }

    window.setTimeout(() => {
      onPostCreated(postData);
      reset();
      setIsPosting(false);
    }, 160);
  };

  return (
    <form className="glass-panel glass-border font-z8 rounded-3xl p-4 space-y-4" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-vouch-emerald/10 text-vouch-emerald">
            <strong className="text-xs font-black">{initials}</strong>
          </div>

          <div>
            <span className="terminal-text text-white/40">Home Feed</span>
            <h2 className="text-base font-black text-white leading-tight mt-0.5">Share a Vouch</h2>
            <p className="mt-0.5 flex items-center gap-2 text-[11px] text-white/40">
              <strong className="text-white/70">{profileName || 'VouchEdge Creator'}</strong>
              <em className="not-italic flex items-center gap-1"><Lock className="h-3 w-3" /> Public post</em>
            </p>
          </div>
        </div>

        <div className="terminal-text flex shrink-0 items-center gap-1.5 rounded-full bg-vouch-emerald/10 px-2.5 py-1 text-vouch-emerald">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Ready
        </div>
      </div>

      <textarea
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-vouch-emerald/30 min-h-[84px]"
        value={content}
        onChange={(event) => setContent(event.target.value.slice(0, maxChars))}
        placeholder="Example: Judge HR lean — wind out to left, pitcher FB-heavy, lineup confirmed."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5" role="tablist" aria-label="Post type">
        {MODES.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              aria-selected={active}
              aria-pressed={active}
              className={[
                'flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all',
                active ? 'bg-vouch-emerald/10 text-vouch-emerald' : 'text-white/40 hover:text-white hover:bg-white/[0.03]',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0">
                <strong className="block text-xs font-bold leading-none truncate">{item.label}</strong>
                <em className="not-italic block text-[10px] text-white/30 mt-0.5 truncate">{item.helper}</em>
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <label className="block">
          <span className="terminal-text text-white/40">Sport</span>
          <select
            value={sport}
            onChange={(event) => setSport(event.target.value)}
            aria-label="Sport"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs text-white outline-none focus:border-vouch-emerald/30"
          >
            <option value="MLB">MLB</option>
            <option value="NBA">NBA</option>
            <option value="NFL">NFL</option>
            <option value="NHL">NHL</option>
          </select>
        </label>

        <label className="block">
          <span className="terminal-text text-white/40">{marketLabel}</span>
          {mode === 'PARLAY' && savedSlips.length > 0 ? (
            <select
              value={selectedSlipId}
              onChange={(event) => setSelectedSlipId(event.target.value)}
              aria-label="Saved parlay"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs text-white outline-none focus:border-vouch-emerald/30"
            >
              <option value="">Attach saved parlay</option>
              {savedSlips.map((slip) => (
                <option key={slip.id} value={slip.id}>
                  {slip.title || `${slip.legs?.length || 0}-leg slip`}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={market}
              onChange={(event) => setMarket(event.target.value)}
              placeholder={marketPlaceholder}
              aria-label="Game or market"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-vouch-emerald/30"
            />
          )}
        </label>

        <label className="block">
          <span className="terminal-text text-white/40">{oddsLabel}</span>
          <input
            value={odds}
            onChange={(event) => setOdds(event.target.value)}
            placeholder={mode === 'RESULT' ? '1.5' : '+140 or trend'}
            aria-label="Odds or trend"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-vouch-emerald/30"
          />
        </label>

        <label className="block">
          <span className="terminal-text text-white/40">Tags</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="#MLB, #HR"
            aria-label="Tags"
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-vouch-emerald/30"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <span className={['text-[11px]', remaining < 40 ? 'text-rose-400' : 'text-white/30'].join(' ')}>{remaining} left</span>

        <button
          type="submit"
          disabled={!canPost}
          className="flex items-center gap-2 rounded-xl bg-vouch-emerald px-5 py-2.5 text-sm font-bold text-black transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {isPosting ? 'Posting...' : (
            <>
              <Send className="h-4 w-4" />
              Post Vouch
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-white/30">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-vouch-emerald/60" />
        <span>Posts appear instantly in your feed. Results and saved parlays stay tied to your VouchEdge profile.</span>
      </div>
    </form>
  );
}
