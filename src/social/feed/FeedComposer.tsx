import React from 'react';
import { CheckCircle2, Send, Sparkles, TrendingUp, Trophy, FileText, MessageCircle, Mic, Square, Play } from 'lucide-react';
import { FeedPost, Parlay } from '../../types';
import { uploadPostAudio } from '../../lib/postAudioUpload';

type ComposerMode = 'DISCUSSION' | 'AUDIO' | 'VOUCH' | 'PARLAY' | 'RESULT' | 'RESEARCH_NOTE';

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
  { id: 'DISCUSSION', label: 'Post', icon: MessageCircle },
  { id: 'AUDIO', label: 'Voice', icon: Mic },
  { id: 'VOUCH', label: 'Pick', icon: Sparkles },
  { id: 'PARLAY', label: 'Parlay', icon: TrendingUp },
  { id: 'RESULT', label: 'Result', icon: Trophy },
  { id: 'RESEARCH_NOTE', label: 'Note', icon: FileText },
];

export default function FeedComposer({
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

  const [mode, setMode] = React.useState<ComposerMode>('DISCUSSION');
  const [content, setContent] = React.useState('');
  const [sport, setSport] = React.useState('MLB');
  const [market, setMarket] = React.useState('');
  const [odds, setOdds] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [selectedSlipId, setSelectedSlipId] = React.useState('');
  const [isPosting, setIsPosting] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = React.useState<string | null>(null);
  const [isRecording, setIsRecording] = React.useState(false);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const audioStreamRef = React.useRef<MediaStream | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const maxChars = 360;
  const remaining = maxChars - content.length;
  const canPost = (content.trim().length >= 3 || audioBlob !== null) && remaining >= 0 && !isPosting;
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
    setAudioBlob(null);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setMode('DISCUSSION');
    setExpanded(false);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    audioChunksRef.current = [];
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    });
    recorder.addEventListener('stop', () => {
      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      setAudioBlob(blob);
      setAudioPreviewUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      recorderRef.current = null;
      setIsRecording(false);
    });
    audioStreamRef.current = stream;
    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => recorderRef.current?.stop();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPost) return;

    const selectedSlip = savedSlips.find((slip) => slip.id === selectedSlipId);
    const parsedTags = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

    setIsPosting(true);

    let uploadedAudio: { mediaPath: string; mediaUrl: string } | undefined;
    try {
      if (mode === 'AUDIO') {
        if (!audioBlob) return;
        uploadedAudio = await uploadPostAudio(audioBlob);
      }
    } catch (error) {
      setIsPosting(false);
      window.alert(error instanceof Error ? error.message : 'Voice upload failed.');
      return;
    }

    const postData: Partial<FeedPost> = {
      content: content.trim() || 'Voice post',
      postType: mode,
      sportBadge: sport,
      sourceBadge: 'Community',
      isVerified: false,
      mediaUrl: uploadedAudio?.mediaUrl,
      mediaPath: uploadedAudio?.mediaPath,
      mediaType: uploadedAudio ? 'audio' : undefined,
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

    onPostCreated(postData);
    reset();
    setIsPosting(false);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="feed-composer w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] text-left hover:bg-white/[0.02] transition-colors"
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
    <div className="feed-composer border-b border-white/[0.08] px-4 py-3 font-z8">
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

          {mode === 'AUDIO' && (
            <div className="rounded-2xl border border-vouch-cyan/20 bg-vouch-cyan/[0.04] p-3">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void (isRecording ? stopRecording() : startRecording())}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${isRecording ? 'bg-rose-400 text-black' : 'bg-vouch-cyan text-obsidian-900'}`}
                >
                  {isRecording ? <Square className="h-3.5 w-3.5 fill-current" /> : <Mic className="h-3.5 w-3.5" />}
                  {isRecording ? 'Stop recording' : audioBlob ? 'Record again' : 'Record voice'}
                </button>
                <span className="text-xs text-white/50">{isRecording ? 'Recording…' : 'Up to 8 MB. Your voice post is public.'}</span>
              </div>
              {audioPreviewUrl && (
                <div className="mt-3 flex items-center gap-2">
                  <Play className="h-4 w-4 text-vouch-cyan" />
                  <audio controls src={audioPreviewUrl} className="h-8 max-w-full" />
                </div>
              )}
            </div>
          )}

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

          {mode !== 'DISCUSSION' && (
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
          )}

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
