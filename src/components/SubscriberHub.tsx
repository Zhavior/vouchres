import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Send, 
  Lock, 
  Settings, 
  ChevronLeft, 
  Megaphone, 
  Sliders, 
  Heart, 
  Check, 
  Calendar, 
  Award,
  DollarSign, 
  Flame,
  ThumbsUp,
  Target,
  Trophy,
  ShieldAlert,
  Zap,
  Ticket
} from 'lucide-react';
import { CreatorProofProfile, Parlay, Vouch } from '../types';
import { decimalToAmerican } from '../utils/oddsHelper';
import { getFounderPointsLabel } from "../lib/founderAccess";
import { useAuth } from '../lib/useAuth';
import { useSubscriberHubData, type SubscriberChannel } from '../hooks/useSubscriberHubData';
import {
  Z8_ACTIVE,
  Z8_DISPLAY,
  Z8_IDLE,
  Z8_LABEL,
  Z8_PAGE,
  Z8_PAGE_GAP,
  Z8_PAGE_PAD_X,
  Z8_PAGE_PAD_Y,
  Z8_PANEL_PREMIUM,
  Z8_SECTION_HEADER,
  Z8_WARNING,
} from '../theme/z8Tokens';


const cleanCustomerText = (value?: string | number | null): string =>
  String(value ?? "")
    .replace(/\|\|meta:.*$/i, "")
    .replace(/\\n/g, " ")
    .replace(/source=manual_builder\s*/gi, "")
    .replace(/source=manual\s*/gi, "")
    .replace(/clientRef=[^\s]+/gi, "")
    .replace(/\bleg-\d+-[a-z0-9-]+\b/gi, "")
    .replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const getPublicParlayTitle = (title?: string | number | null): string =>
  cleanCustomerText(title) || "VouchEdge Premium Slip";

const getPublicLegSelection = (selection?: string | number | null): string =>
  cleanCustomerText(selection) || "Player prop";

const shouldShowPublicGameLabel = (game?: string | number | null): boolean => {
  const cleaned = cleanCustomerText(game);
  if (!cleaned) return false;
  if (/^leg-/i.test(cleaned)) return false;
  if (/^[a-f0-9-]{12,}$/i.test(cleaned)) return false;
  return true;
};


interface SubscriberHubProps {
  profile: CreatorProofProfile;
  onUpdateProfile: (updated: Partial<CreatorProofProfile>) => void;
  onSectionChange: (section: string) => void;
}

export default function SubscriberHub({
  profile,
  onUpdateProfile,
  onSectionChange
}: SubscriberHubProps) {
  const { user } = useAuth();
  const {
    channels,
    loading: channelsLoading,
    error: channelsError,
    ownerChannelId,
    subscribedChannelIds,
    premiumParlays,
    parlaysLoading,
    announcements,
    announcementsLoading,
    chatMessages,
    chatLoading,
    loadChannelParlays,
    loadChannelAnnouncements,
    loadChannelMessages,
    sendChannelMessage,
    publishAnnouncement,
    followChannel,
  } = useSubscriberHubData({
    userId: user?.id ?? null,
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio,
    winRate: profile.winRate,
    totalPicks: profile.totalPicks,
  });

  const [activeTab, setActiveTab] = useState<'explore' | 'channel_settings'>('explore');
  const [selectedCapperId, setSelectedCapperId] = useState<string | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedCapperForSub, setSelectedCapperForSub] = useState<SubscriberChannel | null>(null);
  const [chatInnerTab, setChatInnerTab] = useState<'chat' | 'parlays' | 'announcements'>('chat');
  const [parlayReactions, setParlayReactions] = useState<Record<string, Record<string, number>>>({});
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [announcementPublishing, setAnnouncementPublishing] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [subPlans] = useState([
    { months: 1, name: 'Follow', price: 0, savings: 'Free during beta', note: 'Follow creators to unlock shared parlays.' },
  ]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editPerk, setEditPerk] = useState<string>('');

  const selectedChannel = channels.find((channel) => channel.id === selectedCapperId);

  useEffect(() => {
    if (selectedChannel) {
      void loadChannelParlays(selectedChannel);
      void loadChannelAnnouncements(selectedChannel);
      void loadChannelMessages(selectedChannel);
    }
  }, [selectedChannel, loadChannelParlays, loadChannelAnnouncements, loadChannelMessages]);

  const handleSubscribe = async (channel: SubscriberChannel) => {
    try {
      await followChannel(channel);
      setShowSubModal(false);
      setSelectedCapperForSub(null);
      alert(`You are now following ${channel.name}. Shared parlays unlock in their channel.`);
    } catch (err: any) {
      alert(err?.message ?? 'Failed to follow this creator.');
    }
  };

  const handleReactToParlay = (parlayId: string, emoji: string) => {
    const activeReacts = parlayReactions[parlayId] || {};
    setParlayReactions({
      ...parlayReactions,
      [parlayId]: {
        ...activeReacts,
        [emoji]: (activeReacts[emoji] || 0) + 1,
      },
    });
  };

  const handleSavePlanEdit = (_index: number) => {
    setEditingIndex(null);
    alert('Paid subscription tiers are not live yet. Follow is free during beta.');
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !chatDraft.trim()) return;
    setChatSending(true);
    try {
      await sendChannelMessage(selectedChannel, chatDraft);
      setChatDraft('');
    } catch (err: any) {
      alert(err?.message ?? 'Failed to send message.');
    } finally {
      setChatSending(false);
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementDraft.trim()) return;
    setAnnouncementPublishing(true);
    try {
      await publishAnnouncement(announcementDraft);
      setAnnouncementDraft('');
      if (selectedChannel) {
        await loadChannelAnnouncements(selectedChannel);
      }
    } catch (err: any) {
      alert(err?.message ?? 'Failed to publish announcement.');
    } finally {
      setAnnouncementPublishing(false);
    }
  };

  return (
    <main className={`${Z8_PAGE} w-full ${Z8_PAGE_PAD_X} ${Z8_PAGE_PAD_Y} ${Z8_PAGE_GAP}`} id="subscriber-hub-root">
      
      {/* Demo banner */}
      <div className="flex items-center gap-2.5 rounded-xl border border-vouch-amber/25 bg-vouch-amber/8 p-2.5 text-[11px] text-vouch-amber/85">
        <span className={`${Z8_LABEL} rounded border border-vouch-cyan/40 bg-vouch-cyan/15 px-1.5 py-0.5 text-vouch-cyan`}>Live</span>
        Follow cappers to unlock shared parlay picks. Club chat and announcements are live; paid tiers remain in beta.
      </div>

      {/* Page Header */}
      <header className={`${Z8_PANEL_PREMIUM} flex flex-col justify-between gap-4 rounded-2xl p-4 text-left md:flex-row md:items-center`} id="hub-head">
        <div className={Z8_SECTION_HEADER}>
          <span className={`${Z8_LABEL} inline-flex w-fit max-w-fit items-center gap-1 rounded-full border border-vouch-cyan/30 bg-vouch-cyan/10 px-2.5 py-0.5 text-vouch-cyan`}>
            <Sparkles className="h-3.5 w-3.5" />
            Premium VouchEdge Clubs
          </span>
          <h1 className={`${Z8_DISPLAY} mt-2 uppercase tracking-tight`}>
            Exclusive Subscriber Space
          </h1>
          <p className="text-xs text-white/45">
            Follow verified cappers and creators. Shared parlays unlock after you follow — no fake subscriber data.
            {channelsError ? ` (${channelsError})` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('explore')}
            className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wide transition-all ${
              activeTab === 'explore' && !selectedCapperId ? Z8_ACTIVE : Z8_IDLE
            }`}
          >
            Explore Channels
          </button>
          <button
            onClick={() => {
              setActiveTab('channel_settings');
              setSelectedCapperId(null);
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wide transition-all ${
              activeTab === 'channel_settings' ? Z8_ACTIVE : Z8_IDLE
            }`}
          >
            <Settings className="h-4 w-4" />
            My Club Config
          </button>
        </div>
      </header>

      {/* Explorer Mode cards screen */}
      {activeTab === 'explore' && !selectedCapperId && (
        <div className="space-y-6">
          <div className={`${Z8_PANEL_PREMIUM} rounded-2xl p-4 text-left`}>
            <h3 className={`${Z8_LABEL} text-sm text-white/80`}>
              How VouchEdge Subscriptions Work
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-white/45">
              Follow creators to unlock their shared parlay picks. Club chat and announcements are live; paid tiers remain in beta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channelsLoading && (
              <div className="col-span-full text-center text-xs font-mono text-white/45 py-8">Loading channels…</div>
            )}
            {channels.map((capper) => {
              const isSubscribed = subscribedChannelIds.includes(capper.id);
              const isOwner = capper.id === ownerChannelId;

              return (
                <div 
                  key={capper.id}
                  className="bg-ve-storm/45 backdrop-blur-md border border-slate-855 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-white/10 transition-all text-left relative group hover:shadow-2xl hover:shadow-indigo-950/20"
                >
                  {/* Visual Category badge */}
                  <div className="p-4 border-b border-slate-850/60 bg-obsidian-900/20 flex justify-between items-center">
                    <span className="text-[9px] bg-black/25 px-2.5 py-0.5 border border-slate-850 rounded font-black font-mono text-emerald-400 uppercase">
                      {capper.winRate.toFixed(1)}% WINRATE
                    </span>
                    <span className="text-[9.5px] bg-ve-surface-panel text-vouch-cyan px-2.5 py-0.5 rounded-full border border-indigo-900/35 font-extrabold uppercase font-mono tracking-wide">
                      {capper.badge}
                    </span>
                  </div>

                  <div className="p-5 space-y-3 flex-1">
                    {/* Capper primary identity metadata */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-obsidian-700 border-2 border-indigo-500/20 flex items-center justify-center text-sky-400 text-sm font-black shadow-md">
                        {capper.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white/90 text-sm flex items-center gap-1">
                          {capper.name}
                        </h4>
                        <p className="text-white/40 font-mono text-[10px]">@{capper.username}</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-white/45 leading-relaxed font-semibold">
                      {capper.bio}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-850/50 pt-2 text-white/45">
                      <span>Total Tracked: <strong>{capper.totalPicks}</strong></span>
                      <span>Subscribers: <strong className="text-white">{capper.subscriberCount}</strong></span>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="p-4 bg-obsidian-900/35 border-t border-slate-850/40">
                    {isOwner ? (
                      <button
                        onClick={() => setSelectedCapperId(capper.id)}
                        className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-550 text-white/90 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Enter Your Owner Chatroom
                      </button>
                    ) : isSubscribed ? (
                      <button
                        onClick={() => setSelectedCapperId(capper.id)}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-emerald-500/40 hover:from-emerald-500/40 hover:to-teal-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.01] text-center flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 animate-bounce" />
                        Enter Exclusive Channel
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedCapperForSub(capper);
                          setShowSubModal(true);
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white/90 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300/20" />
                        Subscribe
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inside Subscriber Exclusive Chat View */}
      {selectedCapperId && (
        <div className="space-y-5" id="capper-chat-space">
          
          {/* Active room back row banner */}
          <div className="bg-ve-storm/30 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCapperId(null)}
                className="p-1.5 bg-black/25 hover:bg-black/35 border border-white/10 rounded-lg text-white/45 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[8.5px] font-bold font-mono px-2 py-0.5 bg-emerald-905 text-emerald-400 border border-emerald-900/30 rounded uppercase tracking-wider">
                  ACTIVE_PREMIUM_SPACE
                </span>
                <h3 className="text-base font-black text-white/90 uppercase tracking-tight">
                  {channels.find(c => c.id === selectedCapperId)?.name} Exclusive Hub
                </h3>
              </div>
            </div>

            {/* Hub tabs selector */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <button
                onClick={() => setChatInnerTab('chat')}
                className={`px-3 py-1.5 rounded-lg font-black transition-all ${
                  chatInnerTab === 'chat'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-505/30'
                    : 'bg-transparent text-slate-450 hover:text-white'
                }`}
              >
                💬 Chatroom
              </button>
              <button
                onClick={() => setChatInnerTab('parlays')}
                className={`px-3 py-1.5 rounded-lg font-black transition-all flex items-center gap-1 ${
                  chatInnerTab === 'parlays'
                    ? 'bg-emerald-500/20 text-emerald-450 border border-emerald-500/30'
                    : 'bg-transparent text-slate-420 hover:text-white'
                }`}
              >
                📊 Parlays-Only
              </button>
              <button
                onClick={() => setChatInnerTab('announcements')}
                className={`px-3 py-1.5 rounded-lg font-black transition-all flex items-center gap-1 ${
                  chatInnerTab === 'announcements'
                    ? 'bg-vouch-cyan/15 text-vouch-cyan border border-vouch-cyan/30'
                    : 'bg-transparent text-slate-420 hover:text-white'
                }`}
              >
                📢 Announcements
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Sidebar inside the active space: Capper Information Card */}
            <div className="lg:col-span-1 border border-slate-855 rounded-2xl bg-ve-storm/30 p-5 space-y-4 text-left">
              <div>
                <h4 className="text-[10px] font-bold text-vouch-cyan font-mono uppercase tracking-wider mb-2">CLUB IDENTITY CARD</h4>
                <div className="w-12 h-12 rounded-full bg-indigo-950 flex items-center justify-center border border-indigo-900/50 text-vouch-cyan/80 font-bold mb-3">
                  {channels.find(c => c.id === selectedCapperId)?.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <h3 className="font-extrabold text-white/90 text-sm">
                  {channels.find(c => c.id === selectedCapperId)?.name}
                </h3>
                <p className="text-[11px] text-white/40">@{channels.find(c => c.id === selectedCapperId)?.username}</p>
              </div>

              <div className="space-y-2.5 text-xs text-white/45">
                <p className="font-semibold text-white/65">
                  {channels.find(c => c.id === selectedCapperId)?.bio}
                </p>
                <div className="border-t border-slate-850/50 pt-2.5 space-y-1.5 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span>WINRATE:</span>
                    <strong className="text-emerald-400">{channels.find(c => c.id === selectedCapperId)?.winRate}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>SUBSCRIBERS:</span>
                    <strong className="text-white">{channels.find(c => c.id === selectedCapperId)?.subscriberCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>TRACKED:</span>
                    <strong className="text-sky-400">{channels.find(c => c.id === selectedCapperId)?.totalPicks}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-obsidian-900/40 p-3 rounded-lg border border-slate-850 font-mono text-[9px] text-dashed text-white/40 leading-normal">
                🛡️ Follow-gated picks only. Shared parlays require an active follow relationship.
              </div>
            </div>

            {/* Center Area inside the active space depends on selected tabs */}
            <div className="lg:col-span-3 min-w-0" id="chat-hub-center-container">
              
              {/* RENDERING CHATROOM */}
              {chatInnerTab === 'chat' && (
                <div className="bg-ve-storm/35 border border-slate-850 rounded-2xl flex flex-col h-[520px] overflow-hidden" id="tab-chatroom">
                  <div className="px-4 py-3 border-b border-slate-850 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-vouch-cyan" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white/70">Subscriber Club Chat</h4>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 text-left">
                    {chatLoading ? (
                      <p className="text-center text-xs text-white/40 font-mono uppercase py-8">Loading chat…</p>
                    ) : chatMessages.length === 0 ? (
                      <p className="text-center text-xs text-white/40 font-mono uppercase py-8">
                        No messages yet. Follow this club and say hello.
                      </p>
                    ) : (
                      chatMessages.map((message) => (
                        <div key={message.id} className="rounded-xl border border-slate-850 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-mono font-black uppercase text-vouch-cyan">
                              @{message.authorHandle}
                            </span>
                            <time className="text-[10px] text-white/30 font-mono">
                              {new Date(message.createdAt).toLocaleString()}
                            </time>
                          </div>
                          <p className="text-sm text-white/85 whitespace-pre-wrap">{message.body}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendChat} className="border-t border-slate-850 p-3 flex gap-2">
                    <input
                      type="text"
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      placeholder={selectedChannel?.isFollowing || selectedChannel?.kind === 'owner' ? 'Message the club…' : 'Follow to join chat'}
                      disabled={!selectedChannel || (selectedChannel.kind !== 'owner' && !selectedChannel.isFollowing) || chatSending}
                      className="flex-1 bg-obsidian-900 border border-slate-850 rounded-lg px-3 py-2 text-white/90 text-xs placeholder-slate-550 outline-none disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={!selectedChannel || (selectedChannel.kind !== 'owner' && !selectedChannel.isFollowing) || chatSending || !chatDraft.trim()}
                      className="px-3 py-2 bg-indigo-650 text-white/90 rounded-lg disabled:opacity-60"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* RENDERING PREMIUM PARLAYS ONLY */}
              {chatInnerTab === 'parlays' && (
                <div className="space-y-4" id="tab-premium-parlays">
                  <div className="bg-ve-storm/30 border border-slate-855 p-4 rounded-xl text-left flex items-start gap-3">
                    <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white/65">Capper Locked Premium Slips</h4>
                      <p className="text-[10px] text-white/40 leading-normal mt-0.5">
                        Shared parlays from creators you follow. Each pick links to a public proof record when posted to the feed.
                      </p>
                    </div>
                  </div>

                  {parlaysLoading ? (
                    <div className="p-12 text-center bg-black/25/35 border border-dashed border-slate-850 rounded-2xl text-white/40">
                      <Sliders className="w-8 h-8 mx-auto text-white/35 mb-2 animate-spin" />
                      <p className="text-xs uppercase font-mono font-bold tracking-wider">Loading shared parlays…</p>
                    </div>
                  ) : premiumParlays.length === 0 ? (
                    <div className="p-12 text-center bg-black/25/35 border border-dashed border-slate-850 rounded-2xl text-white/40">
                      <Sliders className="w-8 h-8 mx-auto text-white/35 mb-2" />
                      <p className="text-xs uppercase font-mono font-bold tracking-wider">No active premium parlays posted yet</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {premiumParlays.map((parlay) => {
                        const reactions = parlayReactions[parlay.id] || {};
                        return (
                          <div key={parlay.id} className="bg-ve-storm/40 border border-slate-850 rounded-2xl p-5 text-left relative overflow-hidden shadow-xl hover:border-white/10 transition-all">
                            {/* Parlay premium badge */}
                            <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
                              <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wider flex items-center gap-1.5 uppercase">
                                <Ticket className="w-4 h-4 text-emerald-400 shrink-0" />
                                {getPublicParlayTitle(parlay.title)}
                              </span>
                              <span className="text-[10px] bg-black/25 border border-white/10 text-white/45 font-mono px-2 py-0.5 rounded-full font-bold">
                                Wager: {parlay.wagerAmount} units
                              </span>
                            </div>

                            {/* Legs checklist render */}
                            <div className="space-y-2.5">
                              {parlay.legs.map((leg) => (
                                <div key={leg.id} className="p-2.5 bg-obsidian-900/40 rounded-xl border border-slate-850/50 flex justify-between items-center text-xs">
                                  <div className="space-y-0.5">
                                    <span className="text-[8.5px] font-bold font-mono px-1.5 bg-ve-surface-panel border border-blue-900/30 text-sky-400 rounded uppercase">
                                      {shouldShowPublicGameLabel(leg.game) ? cleanCustomerText(leg.game) : 'MLB'}
                                    </span>
                                    <p className="font-extrabold text-white/90 uppercase text-[11px] mt-1">{getPublicLegSelection(leg.selection)}</p>
                                  </div>
                                  <span className="font-mono text-[10px] font-black text-emerald-400">
                                    {(leg.odds > 0) ? `+${decimalToAmerican(leg.odds)}` : decimalToAmerican(leg.odds)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Risk Tier & Payout preview summary indicators block */}
                            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-obsidian-900/20 p-3 rounded-xl border border-slate-850/50 font-mono text-[10px]">
                              <div className="flex gap-4">
                                <div>
                                  <span className="block text-[8px] text-white/40 uppercase">RISK TIER</span>
                                  <strong className={`${parlay.riskTier === 'HIGH' ? 'text-red-400' : parlay.riskTier === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'} font-extrabold`}>
                                    {parlay.riskTier}
                                  </strong>
                                </div>
                                <div>
                                  <span className="block text-[8px] text-white/40 uppercase">COMBINED ODDS</span>
                                  <strong className="text-white">x{parlay.oddsValue.toFixed(2)} ({parlay.totalOdds})</strong>
                                </div>
                              </div>
                              <div className="text-left md:text-right">
                                <span className="block text-[8px] text-white/40 uppercase">ESTIMATED SUBSCRIBER PAYOUT</span>
                                <strong className="text-emerald-400 font-black text-sm">${parlay.payoutAmount?.toFixed(2)}</strong>
                              </div>
                            </div>

                            {/* Interactive Reactions list where sub can comment/upvote */}
                            <div className="mt-4 pt-3 border-t border-slate-850/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                              <span className="text-[9px] text-white/40 uppercase">REACTIONS FOR SUBSCRIBER VERIFIED SLIP</span>
                              <div className="flex items-center gap-2">
                                {Object.entries(reactions).map(([reaction, qty]) => (
                                  <button
                                    key={reaction}
                                    onClick={() => handleReactToParlay(parlay.id, reaction)}
                                    className="p-1 px-3.5 bg-black/35 hover:bg-black/35 rounded-lg border border-slate-850/60 font-mono text-xs flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <span>{reaction}</span>
                                    <span className="text-slate-350 font-black">{qty}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* RENDERING ANNOUNCEMENTS ONLY */}
              {chatInnerTab === 'announcements' && (
                <div className="space-y-4 text-left" id="tab-announcements">
                  <div className="bg-ve-storm/30 border border-slate-860 p-4 rounded-xl text-left flex items-start gap-3">
                    <Megaphone className="w-5 h-5 text-vouch-cyan shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white/65">Club Announcements Feed</h4>
                      <p className="text-[10px] text-white/40 leading-normal mt-0.5">
                        Text-only club broadcasts for followers. Parlay shares still go through the main feed and lock on share.
                      </p>
                    </div>
                  </div>

                  {selectedCapperId === ownerChannelId && (
                    <form
                      onSubmit={handlePublishAnnouncement}
                      className="p-4 bg-black/30 border border-indigo-900/30 rounded-xl space-y-3"
                    >
                      <label className="block text-[9px] text-vouch-cyan font-mono font-black uppercase tracking-wider">
                        BROADCAST NEW OFFICIAL CLUB ANNOUNCEMENT
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="announcement_input"
                          name="announcement_input"
                          type="text"
                          value={announcementDraft}
                          onChange={(e) => setAnnouncementDraft(e.target.value)}
                          placeholder="Share an update with your subscribers"
                          className="flex-1 bg-obsidian-900 border border-slate-850 rounded-lg px-3 py-2 text-white/90 text-xs placeholder-slate-550 outline-none"
                        />
                        <button
                          type="submit"
                          disabled={announcementPublishing || !announcementDraft.trim()}
                          className="px-4 py-2 bg-indigo-650 text-white/90 text-xs font-mono font-black rounded-lg disabled:opacity-60"
                        >
                          {announcementPublishing ? 'POSTING…' : 'BROADCAST'}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {announcementsLoading ? (
                      <div className="p-8 text-center text-slate-505 font-semibold text-xs uppercase font-mono">
                        Loading announcements…
                      </div>
                    ) : announcements.length === 0 ? (
                      <div className="p-12 text-center bg-black/25/35 border border-dashed border-slate-850 rounded-2xl text-slate-505 font-semibold text-xs uppercase font-mono py-12">
                        No announcements yet
                      </div>
                    ) : (
                      announcements.map((post) => (
                        <article
                          key={post.id}
                          className="rounded-xl border border-slate-850 bg-black/25 p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[10px] font-mono font-black uppercase text-vouch-cyan">
                              @{post.authorHandle}
                            </div>
                            <time className="text-[10px] text-white/35 font-mono">
                              {new Date(post.createdAt).toLocaleString()}
                            </time>
                          </div>
                          <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">{post.body}</p>
                          <div className="text-[9px] text-white/30 font-mono uppercase">
                            {post.viewCount} views
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* Subscription Settings Screen for the Cappers / channel owner */}
      {activeTab === 'channel_settings' && (
        <div className="space-y-6 text-left" id="hub-channel-settings">
          <div className="bg-ve-storm/30 border border-slate-850 p-5 rounded-2xl space-y-2">
            <h3 className="text-base font-black uppercase tracking-wide text-white/90 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-vouch-cyan" />
              Customize Subscription Offerings
            </h3>
            <p className="text-xs text-white/45 lines-normal">
              Paid subscription tiers are not live during beta. Follow is free and gates shared parlay picks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subPlans.map((plan: any, idx: number) => {
              const isEditingThis = editingIndex === idx;
              const durationLabel = plan.months === 1 ? 'Month-to-month' : plan.months === 3 ? '3 Months' : plan.months === 6 ? '6 Months' : '1 Year';

              return (
                <div 
                  key={idx}
                  className="bg-ve-storm/40 border border-slate-850 rounded-2xl p-5 space-y-4 relative flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Visual Segment header */}
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                      <span className="text-xs font-black uppercase tracking-widest text-[#fbbf24] font-mono flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-[#fbbf24]" />
                        {durationLabel}
                      </span>
                    </div>

                    {isEditingThis ? (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[9px] text-white/40 font-mono mb-1">PRICE IN POINTS</label>
                          <input 
                            type="number"
                            value={editPrice}
                            min={1}
                            max={5000}
                            onChange={(e) => setEditPrice(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full bg-obsidian-900 border border-white/10 p-2 text-white/90 text-xs rounded-xl outline-none focus:border-indigo-505"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-white/40 font-mono mb-1">SAVINGS / DISCOUNT LABEL</label>
                          <input 
                            type="text"
                            value={editPerk}
                            onChange={(e) => setEditPerk(e.target.value)}
                            className="w-full bg-obsidian-900 border border-white/10 p-2 text-white/90 text-xs rounded-xl outline-none focus:border-indigo-505"
                            placeholder="e.g. Save 10%"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5 pt-1 text-xs">
                        <div>
                          <span className="block text-[8.5px] uppercase text-white/40 font-mono">Subscription Access Value:</span>
                          <strong className="text-sky-400 font-bold text-base font-mono leading-none">{plan.price} pts</strong>
                        </div>
                        <div>
                          <span className="block text-[8.5px] uppercase text-white/40 font-mono">Discounts / Value Badge:</span>
                          <span className="text-white/65 font-extrabold flex items-center gap-1.5 leading-tight">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            {plan.savings || plan.perk || 'Standard Rate'}
                          </span>
                        </div>
                        <div className="text-[10px] text-white/40 italic mt-1 font-mono">
                          {plan.note || 'Full club access included'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-850/40">
                    {isEditingThis ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSavePlanEdit(idx)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-[#121824] font-black uppercase text-[10px] rounded-lg cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="px-3 py-1.5 bg-black/25 border border-white/10 text-white/45 uppercase text-[10px] rounded-lg cursor-pointer font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingIndex(idx);
                          setEditPrice(plan.price);
                          setEditPerk(plan.savings || plan.perk || '');
                        }}
                        className="w-full py-1.5 bg-ve-surface-panel border border-blue-900/40 hover:bg-indigo-600 text-sky-400 hover:text-white uppercase text-[10px] font-mono font-bold rounded-lg transition-all"
                      >
                        Edit Pricing Config
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Choose Subscription Length Modal */}
      {showSubModal && selectedCapperForSub && (
        <div className="fixed inset-0 bg-obsidian-900/85 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in text-left" id="subscription-length-modal">
          <div className="bg-ve-graphite/95 border border-white/10 p-6 md:p-8 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-6 text-white/90 relative">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <span className="text-[9px] bg-indigo-950 text-vouch-cyan font-extrabold font-mono px-2.5 py-0.5 rounded-full border border-indigo-900/40 uppercase tracking-widest">
                  Subscriber Club Access
                </span>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mt-1.5">
                  Subscribe to {selectedCapperForSub.name}
                </h3>
                <p className="text-xs text-white/45 mt-0.5">
                  Choose your subscription length to unlock premium club insights and tools.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowSubModal(false);
                  setSelectedCapperForSub(null);
                }}
                className="text-white/45 hover:text-white/90 text-xs font-bold font-mono px-2.5 py-1 rounded bg-black/25 border border-white/10 hover:bg-black/35 transition-all uppercase cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Feature List (above pricing) */}
            <div className="bg-ve-storm/45 border border-slate-850 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-205 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Full club access includes:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/65">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                  <span>premium picks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                  <span>premium parlays</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                  <span>club feed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                  <span>verified results</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                  <span>capper breakdowns</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                  <span>Discord alerts if creator enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                  <span>VouchEdge proof tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                  <span>subscriber-only updates</span>
                </div>
              </div>
            </div>

            {/* Header for selection */}
            <div className="text-center space-y-1">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-350">
                Choose your subscription length
              </h4>
              <p className="text-[11px] text-slate-450">Every billing duration unlocks the exact same complete access with greater long-term value</p>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="subscription-lengths-grid">
              {subPlans.map((plan: any, idx: number) => {
                const durationLabel = plan.months === 1 ? 'Monthly' : plan.months === 3 ? '3 Months' : plan.months === 6 ? '6 Months' : '1 Year';
                return (
                  <div 
                    key={idx}
                    className="bg-ve-storm/50 border border-white/10 hover:border-indigo-505/40 p-4 rounded-xl flex flex-col justify-between space-y-4 text-center transition-all duration-200 relative group"
                  >
                    {/* Full access badge */}
                    <div className="absolute -top-2 left-2 right-2 flex justify-center">
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-indigo-950 text-vouch-cyan border border-indigo-900/60 rounded-full">
                        Full Club Access Included
                      </span>
                    </div>

                    <div className="space-y-1 pt-2">
                      <span className="block text-xs font-extrabold uppercase tracking-wider text-white/80">
                        {durationLabel}
                      </span>
                      
                      {(plan.savings || plan.perk) && (
                        <span className="inline-block text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-950/40 text-emerald-450 border border-emerald-900/30 rounded-md">
                          {plan.savings || plan.perk}
                        </span>
                      )}

                      <div className="flex items-baseline justify-center gap-1 pt-1">
                        <span className="text-2xl font-black text-sky-400 font-mono">{plan.price}</span>
                        <span className="text-[10px] text-white/40 font-mono">pts</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="block text-[9px] text-slate-550 font-semibold leading-normal">
                        {plan.note || 'Renews automatically. Cancel anytime.'}
                      </span>

                      <button
                        onClick={() => {
                          if (selectedCapperForSub) {
                            void handleSubscribe(selectedCapperForSub);
                          }
                        }}
                        className="w-full py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white/90 font-bold text-xs rounded-lg transition-all transform hover:scale-[1.02] shadow-md cursor-pointer"
                      >
                        Follow (Free)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer & Balance Indicator */}
            <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-white/40 font-mono border-t border-white/10 pt-4 gap-2">
              <span>Follow is free during beta</span>
              <span>Shared parlays unlock after follow</span>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
