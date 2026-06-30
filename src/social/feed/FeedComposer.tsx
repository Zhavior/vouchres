import React from 'react';
import { Camera, Send, Sparkles, TrendingUp, Trophy, FileText } from 'lucide-react';
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
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'VOUCH', label: 'Pick', icon: Sparkles },
  { id: 'PARLAY', label: 'Parlay', icon: TrendingUp },
  { id: 'RESULT', label: 'Result', icon: Trophy },
  { id: 'RESEARCH_NOTE', label: 'Research', icon: FileText },
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
    <form className="ve-vouch-composer" onSubmit={handleSubmit}>
      <div className="ve-vouch-composer__header">
        <div>
          <span>Home Feed</span>
          <h2>Share a Vouch</h2>
          <p>Post a pick, parlay, result, or matchup read.</p>
        </div>

        <div className="ve-vouch-composer__profile">
          <strong>
            {(profileName || 'VE')
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toUpperCase()}
          </strong>
        </div>
      </div>

      <textarea
        className="ve-vouch-composer__textarea"
        value={content}
        onChange={(event) => setContent(event.target.value.slice(0, maxChars))}
        placeholder="Example: Judge HR lean — wind out to left, pitcher FB-heavy, lineup confirmed."
      />

      <div className="ve-vouch-composer__mode-row" role="tablist" aria-label="Post type">
        {MODES.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={active ? 'is-active' : ''}
              onClick={() => setMode(item.id)}
              aria-selected={active}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="ve-vouch-composer__details">
        <select value={sport} onChange={(event) => setSport(event.target.value)} aria-label="Sport">
          <option value="MLB">MLB</option>
          <option value="NBA">NBA</option>
          <option value="NFL">NFL</option>
          <option value="NHL">NHL</option>
        </select>

        {mode === 'PARLAY' && savedSlips.length > 0 ? (
          <select value={selectedSlipId} onChange={(event) => setSelectedSlipId(event.target.value)} aria-label="Saved parlay">
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
            placeholder="Game / market"
            aria-label="Game or market"
          />
        )}

        <input
          value={odds}
          onChange={(event) => setOdds(event.target.value)}
          placeholder={mode === 'RESULT' ? 'Units' : 'Odds / trend'}
          aria-label="Odds or trend"
        />

        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="#tags"
          aria-label="Tags"
        />
      </div>

      <div className="ve-vouch-composer__footer">
        <button type="button" className="ve-vouch-composer__ghost">
          <Camera className="h-4 w-4" />
          Add image
        </button>

        <div className="ve-vouch-composer__actions">
          <span className={remaining < 40 ? 'is-low' : ''}>{remaining}</span>
          <button type="submit" disabled={!canPost}>
            {isPosting ? 'Posting...' : (
              <>
                <Send className="h-4 w-4" />
                Post Vouch
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
