import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  ImagePlus,
  Lock,
  MessageSquareText,
  Send,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { FeedPost, Parlay } from '../../types';

type ComposerPostType = 'RESEARCH_NOTE' | 'PARLAY' | 'VOUCH' | 'RESULT';

interface FeedComposerProps {
  onPostCreated: (postData: Partial<FeedPost>) => void;
  savedSlips: Parlay[];
  profileName: string;
}

const POST_TYPES: Array<{
  id: ComposerPostType;
  label: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'RESEARCH_NOTE',
    label: 'Research',
    helper: 'Share a matchup note',
    icon: BarChart3,
  },
  {
    id: 'VOUCH',
    label: 'Vouch',
    helper: 'Post a pick',
    icon: Zap,
  },
  {
    id: 'PARLAY',
    label: 'Parlay',
    helper: 'Share a slip',
    icon: MessageSquareText,
  },
  {
    id: 'RESULT',
    label: 'Result',
    helper: 'Log a win/loss',
    icon: Trophy,
  },
];

export default function FeedComposer({ onPostCreated, savedSlips, profileName }: FeedComposerProps) {
  const [postType, setPostType] = React.useState<ComposerPostType>('RESEARCH_NOTE');
  const [content, setContent] = React.useState('');
  const [sport, setSport] = React.useState('MLB');
  const [market, setMarket] = React.useState('');
  const [odds, setOdds] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [selectedParlayId, setSelectedParlayId] = React.useState('');
  const [resultStatus, setResultStatus] = React.useState<'WON' | 'LOST' | 'VOID'>('WON');
  const [resultUnits, setResultUnits] = React.useState('1');
  const [mediaPreview, setMediaPreview] = React.useState<string>('');
  const [mediaType, setMediaType] = React.useState<'image' | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const maxChars = 420;
  const remainingChars = maxChars - content.length;
  const canSubmit = content.trim().length > 2 && remainingChars >= 0 && !isSubmitting;

  const resetComposer = () => {
    setContent('');
    setMarket('');
    setOdds('');
    setTags('');
    setSelectedParlayId('');
    setResultStatus('WON');
    setResultUnits('1');
    setMediaPreview('');
    setMediaType(undefined);
  };

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert('For now, the social feed supports image posts first. Video can come next.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMediaPreview(reader.result);
        setMediaType('image');
      }
    };
    reader.readAsDataURL(file);
  };

  const buildTags = () =>
    tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) return;

    if (postType === 'PARLAY' && savedSlips.length > 0 && !selectedParlayId) {
      window.alert('Choose a saved parlay slip or switch post type.');
      return;
    }

    setIsSubmitting(true);

    const selectedParlay = savedSlips.find((slip) => slip.id === selectedParlayId);
    const parsedTags = buildTags();

    const basePost: Partial<FeedPost> = {
      content: content.trim(),
      postType,
      sportBadge: sport,
      sourceBadge: 'Community',
      isVerified: false,
    };

    if (mediaPreview) {
      basePost.media = {
        type: mediaType || 'image',
        url: mediaPreview,
      };
    }

    if (postType === 'RESEARCH_NOTE') {
      basePost.researchNote = {
        tags: parsedTags.length ? parsedTags : ['#Research'],
        gameContext: market.trim() || undefined,
        trendData: odds.trim() || undefined,
      };
    }

    if (postType === 'VOUCH') {
      basePost.vouch = {
        id: `vouch-${Date.now()}`,
        vouchSource: profileName || 'Community',
        userNote: content.trim(),
        market: market.trim() || 'Community pick',
        sport,
        gameName: market.trim() || 'Today slate',
        odds: odds.trim() || '—',
        status: 'PENDING',
        savedCount: 0,
        vouchedCount: 1,
        createdAt: new Date().toISOString(),
      };
    }

    if (postType === 'PARLAY' && selectedParlay) {
      basePost.parlay = selectedParlay;
      basePost.sportBadge = selectedParlay.legs?.[0]?.sport || sport;
    }

    if (postType === 'RESULT') {
      const units = Number.parseFloat(resultUnits) || 1;
      basePost.result = {
        status: resultStatus,
        units,
        profit: resultStatus === 'WON' ? units : resultStatus === 'LOST' ? -units : 0,
        marketName: market.trim() || 'Community result',
        details: content.trim(),
      };
    }

    window.setTimeout(() => {
      onPostCreated(basePost);
      resetComposer();
      setPostType('RESEARCH_NOTE');
      setIsSubmitting(false);
    }, 180);
  };

  return (
    <form className="ve-real-composer" onSubmit={handleSubmit}>
      <div className="ve-real-composer__top">
        <div className="ve-real-composer__avatar">
          {profileName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'VE'}
        </div>

        <div className="ve-real-composer__identity">
          <strong>{profileName || 'VouchEdge Creator'}</strong>
          <span>
            <Lock className="h-3 w-3" />
            Public VouchEdge post
          </span>
        </div>
      </div>

      <div className="ve-real-composer__types" role="tablist" aria-label="Post type">
        {POST_TYPES.map((type) => {
          const Icon = type.icon;
          const active = postType === type.id;

          return (
            <button
              key={type.id}
              type="button"
              className={active ? 'is-active' : ''}
              onClick={() => setPostType(type.id)}
              aria-selected={active}
            >
              <Icon className="h-4 w-4" />
              <span>
                <strong>{type.label}</strong>
                <em>{type.helper}</em>
              </span>
            </button>
          );
        })}
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value.slice(0, maxChars))}
        placeholder={
          postType === 'VOUCH'
            ? 'Post your pick, why you like it, and what risk level people should know...'
            : postType === 'PARLAY'
              ? 'Tell people why this parlay makes sense...'
              : postType === 'RESULT'
                ? 'Log what happened and what you learned...'
                : 'Share research, matchup notes, lineup reads, weather, pitcher weakness, or trend data...'
        }
        className="ve-real-composer__textarea"
      />

      <div className="ve-real-composer__details">
        <label>
          <span>Sport</span>
          <select value={sport} onChange={(event) => setSport(event.target.value)}>
            <option value="MLB">MLB</option>
            <option value="NBA">NBA</option>
            <option value="NFL">NFL</option>
            <option value="NHL">NHL</option>
          </select>
        </label>

        <label>
          <span>{postType === 'RESULT' ? 'Result Market' : postType === 'VOUCH' ? 'Market / Game' : 'Context'}</span>
          <input
            value={market}
            onChange={(event) => setMarket(event.target.value)}
            placeholder={postType === 'VOUCH' ? 'Yankees vs Red Sox · Judge HR' : 'Game, player, or angle'}
          />
        </label>

        {postType !== 'PARLAY' && (
          <label>
            <span>{postType === 'RESULT' ? 'Units' : 'Odds / Trend'}</span>
            <input
              value={postType === 'RESULT' ? resultUnits : odds}
              onChange={(event) =>
                postType === 'RESULT' ? setResultUnits(event.target.value) : setOdds(event.target.value)
              }
              placeholder={postType === 'RESULT' ? '1.5' : '+140 or trend note'}
            />
          </label>
        )}

        {postType === 'PARLAY' && (
          <label>
            <span>Saved Slip</span>
            <select value={selectedParlayId} onChange={(event) => setSelectedParlayId(event.target.value)}>
              <option value="">Choose saved parlay</option>
              {savedSlips.map((slip) => (
                <option key={slip.id} value={slip.id}>
                  {slip.title || `${slip.legs?.length || 0}-leg parlay`}
                </option>
              ))}
            </select>
          </label>
        )}

        {postType === 'RESULT' && (
          <label>
            <span>Status</span>
            <select value={resultStatus} onChange={(event) => setResultStatus(event.target.value as 'WON' | 'LOST' | 'VOID')}>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
              <option value="VOID">Void</option>
            </select>
          </label>
        )}
      </div>

      <div className="ve-real-composer__tags">
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="Tags: #MLB, #HR, #Parlay, #Research"
        />
      </div>

      {mediaPreview && (
        <div className="ve-real-composer__media">
          <img src={mediaPreview} alt="Post upload preview" />
          <button type="button" onClick={() => {
            setMediaPreview('');
            setMediaType(undefined);
          }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="ve-real-composer__footer">
        <div className="ve-real-composer__tools">
          <label className="ve-real-composer__upload">
            <ImagePlus className="h-4 w-4" />
            Add image
            <input type="file" accept="image/*" onChange={handleMediaUpload} />
          </label>

          <span className={remainingChars < 40 ? 'is-warning' : ''}>
            {remainingChars} left
          </span>
        </div>

        <button type="submit" className="ve-real-composer__submit" disabled={!canSubmit}>
          {isSubmitting ? (
            <>
              <span className="ve-posting-dot" />
              Posting
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Post
            </>
          )}
        </button>
      </div>

      <div className="ve-real-composer__trust">
        <CheckCircle2 className="h-4 w-4" />
        <span>Posts appear instantly in your feed. Backend persistence connects next.</span>
      </div>
    </form>
  );
}
