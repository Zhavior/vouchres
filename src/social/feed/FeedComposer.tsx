import React, { useState } from 'react';
import { 
  FileText, 
  Sliders, 
  CheckCircle, 
  Share2, 
  AlertCircle,
  Tag,
  Bookmark,
  Sparkles,
  Image,
  Film,
  Trash2,
  Paperclip,
  Vote,
  Plus,
  X,
  Crown,
  Award
} from 'lucide-react';
import { Parlay, FeedPost, Vouch } from '../../types';

interface FeedComposerProps {
  onPostCreated: (postData: Partial<FeedPost>) => void;
  savedSlips: Parlay[];
  profileName: string;
}

export default function FeedComposer({ onPostCreated, savedSlips, profileName }: FeedComposerProps) {
  const [activeType, setActiveType] = useState<'RESEARCH_NOTE' | 'PARLAY' | 'VOUCH' | 'RESULT'>('RESEARCH_NOTE');
  const [content, setContent] = useState('');
  
  // Media attachment states
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | undefined>(undefined);
  const [mediaFileName, setMediaFileName] = useState<string>('');
  const [isReadingMedia, setIsReadingMedia] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, expectedType?: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingMedia(true);
    setMediaFileName(file.name);

    const isVideo = file.type.startsWith('video/') || expectedType === 'video';
    setMediaType(isVideo ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        setMediaUrl(event.target.result);
      }
      setIsReadingMedia(false);
    };
    reader.onerror = () => {
      alert('Failed to read file. Please try another one.');
      setIsReadingMedia(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (type: 'image' | 'video', url: string, name: string) => {
    setMediaType(type);
    setMediaUrl(url);
    setMediaFileName(name);
  };

  // Custom states for attachable fields
  // 1. Research Note Specific
  const [tagsInput, setTagsInput] = useState('');
  const [gameContext, setGameContext] = useState('');
  const [trendData, setTrendData] = useState('');

  // 2. Parlay Specific
  const [selectedParlayId, setSelectedParlayId] = useState('');

  // 3. Vouch Specific
  const [vouchMarket, setVouchMarket] = useState('');
  const [vouchSport, setVouchSport] = useState('MLB');
  const [vouchPlayer, setVouchPlayer] = useState('');
  const [vouchGame, setVouchGame] = useState('');
  const [vouchOdds, setVouchOdds] = useState('+140');
  const [vouchNote, setVouchNote] = useState('');
  const [vouchAiConfidence, setVouchAiConfidence] = useState(78);
  const [vouchCapperConfidence, setVouchCapperConfidence] = useState(85);
  const [vouchRiskTier, setVouchRiskTier] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [vouchIsLocked, setVouchIsLocked] = useState(true);
  const [vouchLockTime, setVouchLockTime] = useState('Locks before game time');

  // Custom high-fidelity vouch posting parameters
  const [vouchLine, setVouchLine] = useState('');
  const [vouchSelection, setVouchSelection] = useState('');
  const [vouchLongerBreakdown, setVouchLongerBreakdown] = useState('');
  const [vouchAddToProfileFeed, setVouchAddToProfileFeed] = useState(true);
  const [vouchAddToHomeFeed, setVouchAddToHomeFeed] = useState(true);
  const [vouchCreateXPreview, setVouchCreateXPreview] = useState(true);
  const [vouchAddHashtags, setVouchAddHashtags] = useState(true);
  const [vouchCardTheme, setVouchCardTheme] = useState<'cyber' | 'cosmic' | 'minimalist' | 'neon-pulse' | 'vintage-gold'>('cyber');
  const [vouchVisibility, setVouchVisibility] = useState<'public' | 'private'>('public');

  // 4. Result Specific
  const [resultStatus, setResultStatus] = useState<'WON' | 'LOST' | 'VOID'>('WON');
  const [resultUnits, setResultUnits] = useState('1.5');
  const [resultMarket, setResultMarket] = useState('');
  const [resultProfit, setResultProfit] = useState('2.1');
  const [resultDetail, setResultDetail] = useState('');

  // 5. Poll Specific
  const [isPollActive, setIsPollActive] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const updated = [...pollOptions];
      updated.splice(index, 1);
      setPollOptions(updated);
    }
  };

  const handlePollOptionChange = (index: number, val: string) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const basePost: Partial<FeedPost> = {
      content: content.trim(),
      postType: activeType,
      sportBadge: 'MLB', // Default
      sourceBadge: 'Community' // Default user post
    };

    if (activeType === 'RESEARCH_NOTE') {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((t) => t.startsWith('#') ? t : `#${t}`);

      basePost.researchNote = {
        tags: parsedTags.length > 0 ? parsedTags : ['#Analytics'],
        gameContext: gameContext.trim() || undefined,
        trendData: trendData.trim() || undefined
      };
      if (gameContext) {
        basePost.sportBadge = 'MLB';
      }
    } 
    else if (activeType === 'PARLAY') {
      const chosen = savedSlips.find((p) => p.id === selectedParlayId);
      if (!chosen) {
        alert('Please select an open parlay slip to post, or create one in the Build Parlay tab!');
        return;
      }
      basePost.parlay = chosen;
      basePost.sportBadge = chosen.legs[0]?.sport || 'MLB';
    } 
    else if (activeType === 'VOUCH') {
      if (!vouchMarket || !vouchGame) {
        alert('Please specify the market and game names for this vouch!');
        return;
      }
      const dummyVouch: Vouch = {
        id: `vouch-user-${Date.now()}`,
        vouchSource: 'User Selection',
        userNote: vouchNote || 'Spoke with high correlation',
        market: vouchMarket,
        sport: vouchSport,
        playerOrTeam: vouchPlayer || undefined,
        gameName: vouchGame,
        odds: vouchOdds,
        status: 'PENDING',
        savedCount: 1,
        vouchedCount: 1,
        createdAt: new Date().toISOString(),
        // Add extra fields
        aiConfidence: vouchAiConfidence,
        capperConfidence: vouchCapperConfidence,
        riskTier: vouchRiskTier,
        isLocked: vouchIsLocked,
        lockTime: vouchLockTime,
        // High-fidelity parameters
        line: vouchLine || undefined,
        selection: vouchSelection || undefined,
        longerBreakdown: vouchLongerBreakdown || undefined,
        addToProfileFeed: vouchAddToProfileFeed,
        addToHomeFeed: vouchAddToHomeFeed,
        createXPreview: vouchCreateXPreview,
        addHashtags: vouchAddHashtags,
        cardTheme: vouchCardTheme,
        visibility: vouchVisibility
      };
      basePost.vouch = dummyVouch;
      basePost.sportBadge = vouchSport;
    } 
    else if (activeType === 'RESULT') {
      if (!resultMarket) {
        alert('Please specify which market is settling!');
        return;
      }
      const unitsNum = parseFloat(resultUnits) || 1.0;
      const profitNum = parseFloat(resultProfit) || 1.5;
      basePost.result = {
        status: resultStatus === 'WON' ? 'WON' : resultStatus === 'LOST' ? 'LOST' : 'VOID',
        units: unitsNum,
        profit: resultStatus === 'WON' ? profitNum : -unitsNum,
        marketName: resultMarket,
        details: resultDetail || `Settle verification successful. Units logged: ${unitsNum}`
      };
    }

    if (isPollActive) {
      const activeOptions = pollOptions
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);

      if (activeOptions.length < 2) {
        alert('Please provide at least 2 options for the poll!');
        return;
      }

      basePost.poll = {
        question: pollQuestion.trim() || 'Who wins tonight?',
        options: activeOptions.map((opt) => ({ text: opt, votes: 0 })),
        totalVotes: 0,
        expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(), // 24 hours
      };
    }

    if (mediaUrl && mediaType) {
      basePost.mediaUrl = mediaUrl;
      basePost.mediaType = mediaType;
    }

    onPostCreated(basePost);

    // Reset Composer
    setContent('');
    setTagsInput('');
    setGameContext('');
    setTrendData('');
    setVouchMarket('');
    setVouchPlayer('');
    setVouchGame('');
    setVouchOdds('+120');
    setVouchNote('');
    setResultMarket('');
    setResultDetail('');
    setResultUnits('1.0');
    setResultProfit('1.5');
    setMediaUrl('');
    setMediaType(undefined);
    setMediaFileName('');
    setIsPollActive(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  const currentInitials = profileName.split(' ').map(n=>n[0]).join('');

  return (
    <div 
      className="bg-[#121824] border border-slate-850 rounded-2xl p-4 shadow-lg flex flex-col gap-3 relative overflow-hidden" 
      id="feed-composer-module"
    >
      <div className="absolute top-0 right-0 py-1.5 px-3.5 bg-gradient-to-r from-amber-600/30 to-amber-500/20 text-amber-300 border-l border-b border-amber-500/30 text-[9px] font-mono font-black uppercase tracking-widest rounded-bl-xl flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.15)] select-none">
        <Crown className="w-3 h-3 text-amber-400" />
        VEdge Publisher
      </div>

      <div className="flex gap-3">
        {/* User Mini Avatar representation */}
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 shrink-0 text-sm">
          {currentInitials}
        </div>

        <form onSubmit={handlePostSubmit} className="flex-1 space-y-3.5">
          {/* Main textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share a parlay, vouch, or research note…"
            rows={2}
            className="w-full text-sm bg-transparent border-none text-slate-100 placeholder-slate-500 outline-none resize-none pt-1"
            required
            id="composer-textarea-input"
          />

          {/* Form specific drawers */}
          {activeType === 'RESEARCH_NOTE' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#0b0f19] p-3 rounded-xl border border-slate-800/80 animate-slide-up" id="drawer-research-specs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tags (comma split)</label>
                <input 
                  type="text" 
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Padres, Glasnow"
                  className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-100 p-2 rounded outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Opponent/Game Context</label>
                <input 
                  type="text" 
                  value={gameContext}
                  onChange={(e) => setGameContext(e.target.value)}
                  placeholder="e.g. Padres @ Dodgers"
                  className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-100 p-2 rounded outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Trend / Data Point</label>
                <input 
                  type="text" 
                  value={trendData}
                  onChange={(e) => setTrendData(e.target.value)}
                  placeholder="e.g. Glasnow Over 7.5 Ks in 4/5"
                  className="w-full text-xs bg-slate-900 border border-slate-800 text-slate-100 p-2 rounded outline-none"
                />
              </div>
            </div>
          )}

          {activeType === 'PARLAY' && (
            <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800 animate-slide-up space-y-2 text-xs" id="drawer-parlay-attachment">
              <h5 className="font-bold text-slate-200 uppercase text-[10px] tracking-wide flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                Attach Open Parlay Lab Slip
              </h5>
              
              {savedSlips.length === 0 ? (
                <div className="p-3 text-center border border-dashed border-slate-800 text-slate-500 rounded-lg text-xs leading-normal">
                  No active parlay slips found! Head over to the <span className="text-sky-400 font-bold">Build Parlay</span> tab first to save an analytical slip.
                </div>
              ) : (
                <div className="space-y-2">
                  <select 
                    value={selectedParlayId}
                    onChange={(e) => setSelectedParlayId(e.target.value)}
                    className="w-full bg-slate-900 text-slate-200 border border-slate-800 p-2 rounded outline-none font-medium"
                    required
                  >
                    <option value="">-- Choose a Parlay Slip --</option>
                    {savedSlips.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.legs.length} legs • {p.totalOdds} total odds)
                      </option>
                    ))}
                  </select>
                  {selectedParlayId && (
                    <p className="text-[10px] text-emerald-400 font-semibold uppercase">✓ Attached parlay slip successfully.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeType === 'VOUCH' && (
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-slate-800 animate-slide-up space-y-4 text-xs" id="drawer-vouch-attachment">
              <h5 className="font-bold text-slate-200 uppercase text-[10px] tracking-wide flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                Specify Vouch Pick Details
              </h5>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Sport</label>
                  <select 
                    value={vouchSport} 
                    onChange={(e)=>setVouchSport(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded outline-none"
                  >
                    <option value="MLB">MLB</option>
                    <option value="NBA">NBA</option>
                    <option value="NFL">NFL</option>
                    <option value="NHL">NHL</option>
                    <option value="EPL">EPL</option>
                    <option value="UFC">UFC</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Game / Matchup</label>
                  <input 
                    type="text" 
                    placeholder="Padres @ Dodgers" 
                    value={vouchGame}
                    onChange={(e)=>setVouchGame(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Market (e.g. Strikeouts, Spread)</label>
                  <input 
                    type="text" 
                    placeholder="Manny Machado Over 1.5 Hits" 
                    value={vouchMarket}
                    onChange={(e)=>setVouchMarket(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">American Odds</label>
                  <input 
                    type="text" 
                    placeholder="+140" 
                    value={vouchOdds}
                    onChange={(e)=>setVouchOdds(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded outline-none"
                  />
                </div>
              </div>

              {/* Selection, Line and Theme Style selectors */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Selection (e.g. Over, Dodgers ML)</label>
                  <input 
                    type="text" 
                    placeholder="Over" 
                    value={vouchSelection}
                    onChange={(e)=>setVouchSelection(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Line Threshold (e.g. 1.5, -7.5)</label>
                  <input 
                    type="text" 
                    placeholder="1.5" 
                    value={vouchLine}
                    onChange={(e)=>setVouchLine(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Card Design Theme</label>
                  <select 
                    value={vouchCardTheme}
                    onChange={(e)=>setVouchCardTheme(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded outline-none font-semibold text-cyan-400"
                  >
                    <option value="cyber">Cyber Blue (Modern)</option>
                    <option value="cosmic">Cosmic Nebula (Purple)</option>
                    <option value="minimalist">Minimalist (Dark Gray)</option>
                    <option value="neon-pulse">Neon Pulse (Lime)</option>
                    <option value="vintage-gold">Vintage Gold (Amber)</option>
                  </select>
                </div>
              </div>

              {/* Optional Player + Visibility controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Player/Team Target (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Manny Machado" 
                    value={vouchPlayer}
                    onChange={(e)=>setVouchPlayer(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Choose Visibility</label>
                  <select 
                    value={vouchVisibility}
                    onChange={(e)=>setVouchVisibility(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded outline-none"
                  >
                    <option value="public">Public Vouch (Visible in Home Feed & Vouch Board)</option>
                    <option value="private">Private (My Profile & Subscribers Only)</option>
                  </select>
                </div>
              </div>

              {/* Reasons & Long Breakdown */}
              <div className="grid grid-cols-1 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Short reasoning (Personal Cred Note)</label>
                  <input 
                    type="text" 
                    placeholder="Padres slugging heavily against lefties tonight..." 
                    value={vouchNote}
                    onChange={(e)=>setVouchNote(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Optional Longer Breakdown & Trends Analysis</label>
                  <textarea 
                    rows={2}
                    placeholder="Provide a deep-dive analysis (e.g. San Diego has won 4/5 matchups with rest advantage, cashing over 1.5 hits in 75% of similar starter matchups)..." 
                    value={vouchLongerBreakdown}
                    onChange={(e)=>setVouchLongerBreakdown(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded outline-none resize-none"
                  />
                </div>
              </div>

              {/* Advanced proof metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2.5 border-t border-slate-850">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-slate-400 block flex justify-between">
                    <span>AI Confidence</span>
                    <span className="text-purple-400 font-bold">{vouchAiConfidence}%</span>
                  </label>
                  <input 
                    type="range"
                    min="10"
                    max="100"
                    value={vouchAiConfidence}
                    onChange={(e) => setVouchAiConfidence(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-slate-400 block flex justify-between">
                    <span>Capper Confidence</span>
                    <span className="text-cyan-400 font-bold">{vouchCapperConfidence}%</span>
                  </label>
                  <input 
                    type="range"
                    min="10"
                    max="100"
                    value={vouchCapperConfidence}
                    onChange={(e) => setVouchCapperConfidence(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Risk Tier</label>
                  <select 
                    value={vouchRiskTier}
                    onChange={(e) => setVouchRiskTier(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-1.5 rounded outline-none font-semibold text-slate-200"
                  >
                    <option value="LOW">LOW Risk</option>
                    <option value="MEDIUM">MEDIUM Risk</option>
                    <option value="HIGH">HIGH Risk</option>
                  </select>
                </div>
              </div>

              {/* Viral Exposure & Distribution Options */}
              <div className="pt-2.5 border-t border-slate-850 space-y-2">
                <label className="text-[9px] uppercase font-bold text-slate-500 block">Viral exposure & distribution options</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-[10px]">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white font-semibold bg-slate-900/40 p-2 rounded border border-slate-850/60 transition-colors">
                    <input 
                      type="checkbox"
                      checked={vouchAddToHomeFeed}
                      onChange={(e) => setVouchAddToHomeFeed(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500 h-3.5 w-3.5"
                    />
                    <span>Add to Home Feed</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white font-semibold bg-slate-900/40 p-2 rounded border border-slate-850/60 transition-colors">
                    <input 
                      type="checkbox"
                      checked={vouchAddToProfileFeed}
                      onChange={(e) => setVouchAddToProfileFeed(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500 h-3.5 w-3.5"
                    />
                    <span>Add to Profile</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white font-semibold bg-slate-900/40 p-2 rounded border border-slate-850/60 transition-colors">
                    <input 
                      type="checkbox"
                      checked={vouchCreateXPreview}
                      onChange={(e) => setVouchCreateXPreview(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500 h-3.5 w-3.5"
                    />
                    <span>Create X Preview</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white font-semibold bg-slate-900/40 p-2 rounded border border-slate-850/60 transition-colors">
                    <input 
                      type="checkbox"
                      checked={vouchAddHashtags}
                      onChange={(e) => setVouchAddHashtags(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500 h-3.5 w-3.5"
                    />
                    <span>Add Hashtags</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white font-semibold bg-slate-900/40 p-2 rounded border border-slate-850/60 transition-colors">
                    <input 
                      type="checkbox"
                      checked={vouchIsLocked}
                      onChange={(e) => setVouchIsLocked(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500 h-3.5 w-3.5"
                    />
                    <span>Post Locked (Pre)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeType === 'RESULT' && (
            <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800 animate-slide-up space-y-3 text-xs" id="drawer-result-attachment">
              <h5 className="font-bold text-slate-200 uppercase text-[10px] tracking-wide flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Durable Transparent Result Logging
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Settle Status</label>
                  <select 
                    value={resultStatus}
                    onChange={(e)=>setResultStatus(e.target.value as 'WON' | 'LOST' | 'VOID')}
                    className="w-full bg-slate-900 border border-slate-805 text-white p-2 rounded outline-none"
                  >
                    <option value="WON">WON</option>
                    <option value="LOST">LOST</option>
                    <option value="VOID">VOID</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Units Tested / Risk</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={resultUnits} 
                    onChange={(e)=>setResultUnits(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-805 text-white p-2 rounded outline-none"
                  />
                </div>
                {resultStatus === 'WON' && (
                  <div className="space-y-1 animate-slide-up">
                    <label className="text-[9px] uppercase font-bold text-slate-400">Net Profit Units</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={resultProfit} 
                      onChange={(e)=>setResultProfit(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-805 text-white p-2 rounded outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400">Wager Placement / Market Title</label>
                  <input 
                    type="text" 
                    placeholder="Manny Machado Over 1.5 Hits — WON" 
                    value={resultMarket} 
                    onChange={(e)=>setResultMarket(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-805 text-white p-2 rounded outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">Verified Proof Log (e.g. Machado 2 Hits in 4th inning)</label>
                  <input 
                    type="text" 
                    placeholder="Result: 2 Hits (WIN)" 
                    value={resultDetail}
                    onChange={(e)=>setResultDetail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-805 text-white p-2 rounded outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Twitter-style Poll Form Drawer */}
          {isPollActive && (
            <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800 space-y-3 animate-slide-up" id="drawer-poll-config">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-850">
                <span className="font-bold text-slate-350 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <Vote className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  Create Interactive Poll
                </span>
                <button
                  type="button"
                  onClick={() => setIsPollActive(false)}
                  className="text-slate-500 hover:text-rose-400 text-xs font-mono font-black"
                >
                  [REMOVE]
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono">Poll Question (Optional - defaults to post text)</label>
                  <input
                    type="text"
                    placeholder="e.g., Will Shohei Ohtani hit a home run tonight?"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-805 text-white p-2 rounded outline-none text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-slate-400 font-mono block">Choices (2 to 4 options)</label>
                  
                  {pollOptions.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2 animate-fade-in">
                      <span className="text-[10px] text-slate-500 font-mono w-4 font-bold">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1}`}
                        value={option}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-805 text-white p-2 rounded outline-none text-xs"
                        required={idx < 2}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-450 rounded-lg transition-colors border border-slate-850"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {pollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="mt-1 flex items-center gap-1 text-[10px] text-sky-450 hover:text-sky-400 font-extrabold uppercase bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Option
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Media Attachment Hub (Direct upload and Presets list) */}
          <div className="bg-[#0b0f19]/60 p-3.5 rounded-xl border border-slate-850 space-y-3.5 text-xs" id="composer-media-hub">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850/60 pb-2">
              <span className="font-bold text-slate-350 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-sky-450" />
                Proof Media Attachments (Optional)
              </span>
              
              {/* Native Input File triggers */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer transition-colors border border-slate-800 select-none text-[11px] font-semibold">
                  <Image className="w-3.5 h-3.5 text-sky-400" />
                  <span>Attach Image</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, 'image')} 
                    className="hidden" 
                  />
                </label>
                <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer transition-colors border border-slate-800 select-none text-[11px] font-semibold">
                  <Film className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Attach Video</span>
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={(e) => handleFileChange(e, 'video')} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Media state loader & preview container */}
            {isReadingMedia && (
              <div className="py-2.5 text-center text-slate-500 font-mono text-[10px] animate-pulse">
                🔄 Processing and rendering media stream...
              </div>
            )}

            {mediaUrl && !isReadingMedia && (
              <div className="relative bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col gap-2 animate-slide-up">
                {/* Floating Clear Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl('');
                    setMediaType(undefined);
                    setMediaFileName('');
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-900 text-rose-400 rounded-lg transition-colors flex items-center gap-1 z-10 shadow"
                  title="Remove attachment"
                  id="remove-composer-media-button-id"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Remove</span>
                </button>

                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 truncate max-w-[80%]">
                  <span className="font-extrabold text-sky-400 uppercase">Attached:</span>
                  <span className="truncate text-slate-200">{mediaFileName || 'Embedded preset'}</span>
                  <span className="text-slate-500 uppercase">[{mediaType}]</span>
                </div>

                <div className="flex justify-center bg-slate-950/60 rounded-lg overflow-hidden border border-slate-850 p-2 relative min-h-[90px]">
                  {mediaType === 'image' ? (
                    <img 
                      src={mediaUrl} 
                      alt="Attachment Preview" 
                      className="max-h-40 object-contain rounded border border-slate-800 shadow"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <video 
                      src={mediaUrl} 
                      controls 
                      muted
                      playsInline
                      className="max-h-40 rounded border border-slate-800 shadow max-w-full"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submittor tools footer */}
          <div className="flex items-center justify-between border-t border-slate-850 pt-3">
            {/* Custom pick type toggles */}
            <div className="flex items-center gap-1.5" id="pick-type-drawer-tabs">
              <button
                type="button"
                onClick={() => setActiveType('RESEARCH_NOTE')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all ${
                  activeType === 'RESEARCH_NOTE'
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Research</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveType('PARLAY')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all ${
                  activeType === 'PARLAY'
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Attach Parlay</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveType('VOUCH')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all ${
                  activeType === 'VOUCH'
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vouch Pick</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveType('RESULT')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all ${
                  activeType === 'RESULT'
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log Result</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPollActive(!isPollActive)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all ${
                  isPollActive
                    ? 'bg-amber-600/95 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
                title="Create an interactive poll"
              >
                <Vote className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Poll</span>
              </button>
            </div>

            {/* Post submission release */}
            <div className="flex items-center gap-3">
              {/* Character Limit Indicator */}
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span className={content.length > 280 ? "text-rose-500 font-extrabold animate-pulse" : content.length > 250 ? "text-amber-500 font-extrabold" : "text-slate-500"}>
                  {280 - content.length}
                </span>
              </div>

              <button
                type="submit"
                disabled={!content.trim() || content.length > 280}
                className={`py-2 px-5 rounded-xl font-bold text-xs shadow-lg transition-transform focus:ring-2 focus:ring-sky-500/20 flex items-center gap-1.5 ${
                  content.trim() && content.length <= 280
                    ? 'bg-sky-500 text-white hover:bg-sky-450 active:scale-95 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                id="submit-post-button-id"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Post Pick</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
