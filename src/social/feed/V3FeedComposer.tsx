import React from 'react';
import { CheckCircle2, Send, Sparkles, TrendingUp, Trophy, FileText } from 'lucide-react';
import { FeedPost, Parlay } from '../../types';
import { Z8_SURFACE, Z8_INTERACTIVE } from '../../theme/z8Tokens';
import { apiClient } from '../../lib/apiClient';

type ComposerMode = 'VOUCH' | 'PARLAY' | 'RESULT' | 'RESEARCH_NOTE';

interface FeedComposerProps {
  onPostCreated: (postData: Partial<FeedPost>) => void;
  savedSlips: Parlay[];
  profileName: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  avatarInitials?: string;
}

const MODES: Array<{
  id: ComposerMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'VOUCH', label: 'Pick', icon: Sparkles },
  { id: 'PARLAY', label: 'Parlay', icon: TrendingUp },
  { id: 'RESULT', label: 'Result', icon: Trophy },
  { id: 'RESEARCH_NOTE', label: 'Note', icon: FileText },
];

export default function V3FeedComposer({
  onPostCreated,
  savedSlips,
  profileName,
  expanded: expandedProp,
  onExpandedChange,
  avatarInitials,
}: FeedComposerProps) {
  const [internalExpanded, setInternalExpanded] = React.useState(false);
  const expanded = expandedProp ?? internalExpanded;
  const setExpanded = onExpandedChange ?? setInternalExpanded;

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
  const initials =
    avatarInitials ||
    (profileName || 'VE')
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
    setExpanded(false);
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

    // V3 Architecture: Push intent to Outbox
    void apiClient.post('/api/social/v3/feed/outbox', {
      intent: 'CREATE_POST',
      payload: postData,
    }).catch(() => {});

    window.setTimeout(() => {
      onPostCreated(postData);
      reset();
      setIsPosting(false);
    }, 160);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={`${Z8_SURFACE} ${Z8_INTERACTIVE} w-full flex items-center gap-3 px-4 py-3 text-left`}
        aria-label="Compose a post"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vouch-emerald/15 text-vouch-emerald font-bold text-sm">
          {initials}
        </div>
        <span className="flex-1 text-[15px] text-white/40">What's happening in the slate?</span>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-vouch-emerald px-4 py-1.5 text-[13px] font-bold text-black">
          Post
        </span>
      </button>
    );
  }

  return (
    <div className={`${Z8_SURFACE} px-4 py-3 font-z8 border-b-0`}>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vouch-emerald/15 text-vouch-emerald font-bold text-sm">
          {initials}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <textarea
            id="feed-composer-textarea"
            className="w-full resize-none bg-transparent text-[17px] text-white placeholder:text-white/40 outline-none min-h-[52px] leading-relaxed"
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, maxChars))}
            placeholder="What's happening in the slate?"
            autoFocus
          />

          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Post type">
            {MODES.map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  aria-selected={active}
                  className={[
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors',
                    active ? 'bg-vouch-emerald/15 text-vouch-emerald' : 'text-white/45 hover:bg-white/[0.04] hover:text-white',
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="block">
              <span className="text-[11px] font-medium text-white/40">Sport</span>
              <select
                value={sport}
                onChange={(event) => setSport(event.target.value)}
                aria-label="Sport"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-white outline-none focus:border-vouch-emerald/30"
              >
                <option value="MLB">MLB</option>
                <option value="NBA">NBA</option>
                <option value="NFL">NFL</option>
                <option value="NHL">NHL</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-medium text-white/40">{marketLabel}</span>
              {mode === 'PARLAY' && savedSlips.length > 0 ? (
                <select
                  value={selectedSlipId}
                  onChange={(event) => setSelectedSlipId(event.target.value)}
                  aria-label="Saved parlay"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-white outline-none focus:border-vouch-emerald/30"
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
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-vouch-emerald/30"
                />
              )}
            </label>

            <label className="block">
              <span className="text-[11px] font-medium text-white/40">{oddsLabel}</span>
              <input
                value={odds}
                onChange={(event) => setOdds(event.target.value)}
                placeholder={mode === 'RESULT' ? '1.5' : '+140 or trend'}
                aria-label="Odds or trend"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-vouch-emerald/30"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-medium text-white/40">Tags</span>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="#MLB, #HR"
                aria-label="Tags"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-white placeholder:text-white/25 outline-none focus:border-vouch-emerald/30"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 text-[12px] text-white/35">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-vouch-emerald/60" />
              <span className={remaining < 40 ? 'text-rose-400' : ''}>{remaining} left</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-white/50 hover:bg-white/[0.04] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canPost}
                className="flex items-center gap-1.5 rounded-full bg-vouch-emerald px-4 py-1.5 text-[14px] font-bold text-black transition hover:brightness-110 disabled:opacity-40"
              >
                {isPosting ? 'Posting...' : (
                  <>
                    <Send className="h-4 w-4" />
                    Post
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
