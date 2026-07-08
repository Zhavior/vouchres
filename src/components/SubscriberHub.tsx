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

interface SubscriberCapper {
  id: string;
  name: string;
  username: string;
  winRate: number;
  totalPicks: number;
  bio: string;
  avatarUrl?: string;
  subscriberCount: number;
  monthlyFee: number; // in credits
  badge: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  text: string;
  timestamp: string;
  isCapper?: boolean;
}

export default function SubscriberHub({

  profile,
  onUpdateProfile,
  onSectionChange
}: SubscriberHubProps) {
  const [activeTab, setActiveTab ] = useState<'explore' | 'channel_settings'>('explore');
  const [selectedCapperId, setSelectedCapperId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [newMsgText, setNewMsgText] = useState('');
  const [capperSubscribedIds, setCapperSubscribedIds] = useState<string[]>(() => {
    const cached = localStorage.getItem('vouchedge_subscribed_cappers');
    // Default subscribe to user's own channel as owner
    return cached ? JSON.parse(cached) : ['u-user-current'];
  });

  // Credit balance
  const [credits, setCredits] = useState<number>(() => {
    const cached = localStorage.getItem('vouchedge_theme_credits');
    return cached ? parseInt(cached, 10) : 1000;
  });

  // Selected capper state for subscription modal
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedCapperForSub, setSelectedCapperForSub] = useState<SubscriberCapper | null>(null);

  // Subscription Configuration edited by owner - Durations and Prices
  const [subPlans, setSubPlans] = useState(() => {
    const cached = localStorage.getItem('vouchedge_capper_sub_plans_durations_v1');
    return cached ? JSON.parse(cached) : [
      { months: 1, name: 'Month-to-month', price: 50, savings: 'Standard Rate', note: 'Billed monthly. Cancel anytime.' },
      { months: 3, name: '3 months', price: 135, savings: 'Save 10%', note: 'Billed every 3 months.' },
      { months: 6, name: '6 months', price: 240, savings: 'Save 20%', note: 'Billed every 6 months.' },
      { months: 12, name: '1 year', price: 420, savings: 'Save 30% - Best Value', note: 'Billed annually.' }
    ];
  });

  // Default Cappers
  const [cappers, setCappers] = useState<SubscriberCapper[]>([
    {
      id: 'c-user-current',
      name: profile.displayName || 'Current Creator',
      username: profile.username || 'currentcapper',
      winRate: profile.winRate || 0,
      totalPicks: profile.totalPicks || 0,
      bio: profile.bio || 'Professional MLB predictive metrics expert using core Python regressions.',
      monthlyFee: 0,
      subscriberCount: 0,
      badge: '👑 OWNER'
    },
    {
      id: 'c-alpha-guru',
      name: 'Demo Capper A',
      username: 'alphaguru',
      winRate: 0,
      totalPicks: 0,
      bio: 'Correlated multi-leg strikeout props & platoon-adjusted moneyline vectors.',
      monthlyFee: 50,
      subscriberCount: 0,
      badge: '⚡ VIP_EDGE'
    },
    {
      id: 'c-parabolics',
      name: 'Demo Capper B',
      username: 'homer_parabola',
      winRate: 0,
      totalPicks: 0,
      bio: 'Exit velocity predictions and heavy batter-vs-pitcher stadium variables.',
      monthlyFee: 80,
      subscriberCount: 0,
      badge: '🏮 LAUNCH_PAD'
    }
  ]);

  // Subscribe plans customization states
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<number>(100);
  const [editPerk, setEditPerk] = useState<string>('');

  // Active chat section inner tabs ('chat', 'parlays', 'announcements')
  const [chatInnerTab, setChatInnerTab] = useState<'chat' | 'parlays' | 'announcements'>('chat');

  // React-to-parlays state
  const [parlayReactions, setParlayReactions] = useState<Record<string, Record<string, number>>>({});

  // Premium subscriber-only parlays list
  const [premiumParlays, setPremiumParlays] = useState<Parlay[]>([]);

  // Announcements list (connected to vouchers)
  const [announcements, setAnnouncements] = useState<Record<string, string[]>>({});

  // Synchronize dynamic cappers list on name update
  useEffect(() => {
    setCappers(prev => prev.map(c => {
      if (c.id === 'c-user-current') {
        return {
          ...c,
          name: profile.displayName,
          bio: profile.bio,
          username: profile.username,
          winRate: profile.winRate,
          totalPicks: profile.totalPicks
        };
      }
      return c;
    }));
  }, [profile]);

  // Load premium parlays + announcements + messages
  useEffect(() => {
    try {
      // Messages seed
      const cachedMsgs = localStorage.getItem('vouchedge_sub_messages');
      if (cachedMsgs) {
        setMessages(JSON.parse(cachedMsgs));
      } else {
        const initialMsgs: Record<string, ChatMessage[]> = {
          'c-user-current': [
            { id: 'm1', userId: 'usr-9', displayName: 'Preview Guest', username: 'preview_only', text: 'Preview message — create an account to unlock real subscriber chat.', timestamp: new Date(Date.now() - 36000000).toISOString() },
            { id: 'm2', userId: 'usr-8', displayName: 'Preview Guest 2', username: 'preview_only_2', text: 'Preview-only layout message. No real user data shown.', timestamp: new Date(Date.now() - 18000000).toISOString() },
            { id: 'm3', userId: 'c-user-current', displayName: profile.displayName, username: profile.username, text: 'Welcome to the subscriber chat. This is a demo — real messages appear once subscribers join.', timestamp: new Date(Date.now() - 4000000).toISOString(), isCapper: true }
          ],
          'c-alpha-guru': [
            { id: 'ag1', userId: 'usr-2', displayName: 'Preview Guest 3', username: 'preview_only_3', text: 'Preview question — real subscriber messages appear after login.', timestamp: new Date(Date.now() - 36000000).toISOString() },
            { id: 'ag2', userId: 'c-alpha-guru', displayName: 'Demo Capper A', username: 'alphaguru', text: 'Demo response — subscriber chat is in development.', timestamp: new Date(Date.now() - 10000000).toISOString(), isCapper: true }
          ],
          'c-parabolics': [
            { id: 'hp1', userId: 'usr-5', displayName: 'Preview Guest 4', username: 'preview_only_4', text: 'Preview-only message. No real user data shown.', timestamp: new Date(Date.now() - 20000000).toISOString() }
          ]
        };
        setMessages(initialMsgs);
        localStorage.setItem('vouchedge_sub_messages', JSON.stringify(initialMsgs));
      }

      // Premium parlays seed
      const cachedPremClass = localStorage.getItem('vouchedge_subscriber_parlays');
      if (cachedPremClass) {
        setPremiumParlays(JSON.parse(cachedPremClass));
      } else {
        // Build initial seed parlay
        const initialPrem: Parlay[] = [
          {
            id: 'prem-parlay-seed-1',
            title: '🔥 PREMIUM MLB ELITE TRIFECTA 🔥',
            legs: [
              { id: 'l1', sport: 'MLB', game: 'SD @ LAD', market: 'Strikeouts Over', selection: 'Shohei Ohtani Over 1.5 Hits', odds: 1.85, status: 'PENDING' },
              { id: 'l2', sport: 'MLB', game: 'BOS @ NYY', market: 'Total Runs Over', selection: 'Aaron Judge Over 0.5 HRs', odds: 3.10, status: 'PENDING' }
            ],
            totalOdds: '+475',
            oddsValue: 5.75,
            riskTier: 'HIGH',
            status: 'PENDING',
            bookie: 'Capper Premium Hub',
            wagerAmount: 300,
            payoutAmount: 1725,
            createdAt: new Date().toISOString()
          }
        ];
        setPremiumParlays(initialPrem);
        localStorage.setItem('vouchedge_subscriber_parlays', JSON.stringify(initialPrem));
      }

      // Parlay Reactions
      const cachedReacts = localStorage.getItem('vouchedge_subs_parlay_reactions');
      if (cachedReacts) {
        setParlayReactions(JSON.parse(cachedReacts));
      }

      // Announcements connected to vouchers/vouch totals
      const cachedAnnounce = localStorage.getItem('vouchedge_capper_announcements');
      if (cachedAnnounce) {
        setAnnouncements(JSON.parse(cachedAnnounce));
      } else {
        const defaultAnnounce: Record<string, string[]> = {
          'c-user-current': [
            '📢 CUSTOMER VOUCHER RELEASE: Users who tailed the Red Sox parlay yesterday have earned +100 capper vouch tokens automatically!',
            '⚾ MODEL RE-GRID: Tonight’s weather report indicates 12mph blowing out at Dodger Stadium. Platoon models are re-generating active scores.'
          ],
          'c-alpha-guru': [
            '📢 OUTLANDISH SPREE: 7 wins in our last 8 premium shared summaries! Thank you for backing the metrics.'
          ],
          'c-parabolics': [
            '📢 Exit velocity charts updated. High density hitters look favorable with current dew index.'
          ]
        };
        setAnnouncements(defaultAnnounce);
        localStorage.setItem('vouchedge_capper_announcements', JSON.stringify(defaultAnnounce));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSubscribe = (capper: SubscriberCapper, price: number, monthsName: string) => {
    if (credits < price) {
      alert(`Insufficient credits. This premium ${monthsName} subscription requires ${price} credits. Credit top-up controls are limited during beta.`);
      return;
    }

    const nextCre = credits - price;
    setCredits(nextCre);
    localStorage.setItem('vouchedge_theme_credits', nextCre.toString());

    const updated = [...capperSubscribedIds, capper.id];
    setCapperSubscribedIds(updated);
    localStorage.setItem('vouchedge_subscribed_cappers', JSON.stringify(updated));

    // Increase subscriber count locally
    setCappers(prev => prev.map(c => {
      if (c.id === capper.id) {
        return { ...c, subscriberCount: c.subscriberCount + 1 };
      }
      return c;
    }));

    alert(`🎉 Success! You are now subscribed to "${capper.name}" under the premium ${monthsName}. The exclusive Chatroom is unlocked!`);
  };

  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim() || !selectedCapperId) return;

    const activeCapperMsgs = messages[selectedCapperId] || [];
    const newMsg: ChatMessage = {
      id: `usr-msg-${Date.now()}`,
      userId: 'u-user-current',
      displayName: profile.displayName,
      username: profile.username,
      text: newMsgText.trim(),
      timestamp: new Date().toISOString(),
      isCapper: selectedCapperId === 'c-user-current'
    };

    const updated = {
      ...messages,
      [selectedCapperId]: [...activeCapperMsgs, newMsg]
    };

    setMessages(updated);
    localStorage.setItem('vouchedge_sub_messages', JSON.stringify(updated));
    setNewMsgText('');

    // Trigger funny automated simulated reply if it's not the user's capper to keep room alive
    if (selectedCapperId !== 'c-user-current') {
      setTimeout(() => {
        const responses = [
          "🎯 Spot on! That correlates perfectly with our deep platoon indices.",
          "📊 Let's take a look at the live wind coefficient matrix for tonight.",
          "🔋 I just posted a high-fidelity parlay for subscribers to review. Check the tab above!",
          "🔥 Super excited for this leg. The sportsbooks are mispricing the line by 14%!",
          "⚡ That's clean coding. The pitcher analysis supports it as well."
        ];
        const randomAnswer = responses[Math.floor(Math.random() * responses.length)];
        const systemResponse: ChatMessage = {
          id: `sim-reply-${Date.now()}`,
          userId: selectedCapperId,
          displayName: cappers.find(c => c.id === selectedCapperId)?.name || 'Capper Pro',
          username: cappers.find(c => c.id === selectedCapperId)?.username || 'capper',
          text: randomAnswer,
          timestamp: new Date().toISOString(),
          isCapper: true
        };
        const nextUpdated = {
          ...updated,
          [selectedCapperId]: [...(updated[selectedCapperId] || []), systemResponse]
        };
        setMessages(nextUpdated);
        localStorage.setItem('vouchedge_sub_messages', JSON.stringify(nextUpdated));
      }, 1500);
    }
  };

  const handleAddEmojiToInput = (emoji: string) => {
    setNewMsgText(prev => prev + emoji);
  };

  const handleReactToParlay = (parlayId: string, emoji: string) => {
    const activeReacts = parlayReactions[parlayId] || { '🔥': 4, '🎯': 3, '👍': 5, '💰': 6 };
    const updated = {
      ...parlayReactions,
      [parlayId]: {
        ...activeReacts,
        [emoji]: (activeReacts[emoji] || 0) + 1
      }
    };
    setParlayReactions(updated);
    localStorage.setItem('vouchedge_subs_parlay_reactions', JSON.stringify(updated));
  };

  const handleSavePlanEdit = (index: number) => {
    const updated = [...subPlans];
    updated[index] = {
      ...updated[index],
      price: editPrice,
      savings: editPerk,
      perk: editPerk
    };
    setSubPlans(updated);
    localStorage.setItem('vouchedge_capper_sub_plans_durations_v1', JSON.stringify(updated));
    setEditingIndex(null);
    alert('Subscription configuration plan saved successfully!');
  };

  const handlePublishAnnouncement = (e: React.FormEvent, txt: string) => {
    e.preventDefault();
    if (!txt.trim()) return;

    const currentAnn = announcements['c-user-current'] || [];
    const updatedAnn = [`📢 ANNOUNCEMENT: ${txt.trim()}`, ...currentAnn];
    const n = {
      ...announcements,
      'c-user-current': updatedAnn
    };
    setAnnouncements(n);
    localStorage.setItem('vouchedge_capper_announcements', JSON.stringify(n));
    alert('Announcement published and pushed to premium subscriber timelines!');
  };

  return (
    <div className="w-full text-slate-100 p-4 md:p-6 space-y-6" id="subscriber-hub-root">
      
      {/* Demo banner */}
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-[11px] text-amber-300/80">
        <span className="text-[9px] font-black font-mono uppercase px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/15 text-amber-300">Demo</span>
        Subscriber counts and capper clubs are sample data — real clubs populate when cappers go live.
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-5 text-left" id="hub-head">
        <div className="space-y-1">
          <span className="text-[10px] bg-sky-950 text-sky-400 font-extrabold font-mono px-2.5 py-0.5 rounded-full border border-sky-900/40 uppercase tracking-widest flex items-center gap-1 max-w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            Premium VouchEdge Clubs
          </span>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight uppercase">
            Exclusive Subscriber Space
          </h1>
          <p className="text-xs text-slate-400">
            Gain deep regression insights, locked parlays, and community channels. You have <span className="text-indigo-400 font-extrabold">{credits.toLocaleString()} pts</span> theme & subscribe credits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all tracking-wide ${
              activeTab === 'explore' && !selectedCapperId
                ? 'bg-sky-505 bg-gradient-to-tr from-sky-600 to-indigo-600 text-[#121824]'
                : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-205'
            }`}
          >
            Explore Channels
          </button>
          <button
            onClick={() => {
              setActiveTab('channel_settings');
              setSelectedCapperId(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all tracking-wide flex items-center gap-2 ${
              activeTab === 'channel_settings'
                ? 'bg-indigo-600 text-slate-100 shadow shadow-indigo-505/30'
                : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            My Club Config
          </button>
        </div>
      </div>

      {/* Explorer Mode cards screen */}
      {activeTab === 'explore' && !selectedCapperId && (
        <div className="space-y-6">
          <div className="bg-[#121824]/30 border border-slate-850 p-4 rounded-2xl text-left">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
              How VouchEdge Subscriptions Work
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 lines-normal">
              Backing verified cappers. Subscriptions last for the selected months tier and grant unlockable access to a dedicated realtime **Chatroom**, premium model-correlated **Parlay-Only** items (which you can react and build from), and critical **Anouncements/Vouchers** directly connected to creator proof balances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cappers.map((capper) => {
              const isSubscribed = capperSubscribedIds.includes(capper.id);
              const isOwner = capper.id === 'c-user-current';

              return (
                <div 
                  key={capper.id}
                  className="bg-[#121824]/45 backdrop-blur-md border border-slate-855 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-800 transition-all text-left relative group hover:shadow-2xl hover:shadow-indigo-950/20"
                >
                  {/* Visual Category badge */}
                  <div className="p-4 border-b border-slate-850/60 bg-slate-950/20 flex justify-between items-center">
                    <span className="text-[9px] bg-slate-900 px-2.5 py-0.5 border border-slate-850 rounded font-black font-mono text-emerald-400 uppercase">
                      {capper.winRate.toFixed(1)}% WINRATE
                    </span>
                    <span className="text-[9.5px] bg-[#1a1c30] text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-900/35 font-extrabold uppercase font-mono tracking-wide">
                      {capper.badge}
                    </span>
                  </div>

                  <div className="p-5 space-y-3 flex-1">
                    {/* Capper primary identity metadata */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-indigo-500/20 flex items-center justify-center text-sky-400 text-sm font-black shadow-md">
                        {capper.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-100 text-sm flex items-center gap-1">
                          {capper.name}
                        </h4>
                        <p className="text-slate-500 font-mono text-[10px]">@{capper.username}</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      {capper.bio}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-850/50 pt-2 text-slate-400">
                      <span>Total Tracked: <strong>{capper.totalPicks}</strong></span>
                      <span>Subscribers: <strong className="text-white">{capper.subscriberCount}</strong></span>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="p-4 bg-slate-950/35 border-t border-slate-850/40">
                    {isOwner ? (
                      <button
                        onClick={() => setSelectedCapperId(capper.id)}
                        className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-2 cursor-pointer"
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
                        className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-slate-100 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md text-center flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
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
          <div className="bg-[#121824]/30 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCapperId(null)}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[8.5px] font-bold font-mono px-2 py-0.5 bg-emerald-905 text-emerald-400 border border-emerald-900/30 rounded uppercase tracking-wider">
                  ACTIVE_PREMIUM_SPACE
                </span>
                <h3 className="text-base font-black text-slate-100 uppercase tracking-tight">
                  {cappers.find(c => c.id === selectedCapperId)?.name} Exclusive Hub
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
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-transparent text-slate-420 hover:text-white'
                }`}
              >
                📢 Announcements
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Sidebar inside the active space: Capper Information Card */}
            <div className="lg:col-span-1 border border-slate-855 rounded-2xl bg-[#121824]/30 p-5 space-y-4 text-left">
              <div>
                <h4 className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-wider mb-2">CLUB IDENTITY CARD</h4>
                <div className="w-12 h-12 rounded-full bg-indigo-950 flex items-center justify-center border border-indigo-900/50 text-indigo-300 font-bold mb-3">
                  {cappers.find(c => c.id === selectedCapperId)?.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <h3 className="font-extrabold text-slate-100 text-sm">
                  {cappers.find(c => c.id === selectedCapperId)?.name}
                </h3>
                <p className="text-[11px] text-slate-500">@{cappers.find(c => c.id === selectedCapperId)?.username}</p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-400">
                <p className="font-semibold text-slate-300">
                  {cappers.find(c => c.id === selectedCapperId)?.bio}
                </p>
                <div className="border-t border-slate-850/50 pt-2.5 space-y-1.5 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span>WINRATE:</span>
                    <strong className="text-emerald-400">{cappers.find(c => c.id === selectedCapperId)?.winRate}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>SUBSCRIBERS:</span>
                    <strong className="text-white">{cappers.find(c => c.id === selectedCapperId)?.subscriberCount}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>TRACKED:</span>
                    <strong className="text-sky-400">{cappers.find(c => c.id === selectedCapperId)?.totalPicks}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 font-mono text-[9px] text-dashed text-slate-500 leading-normal">
                🛡️ All subscription rooms are verified locally. Only owners can broadcast official announcements and exclusive slips.
              </div>
            </div>

            {/* Center Area inside the active space depends on selected tabs */}
            <div className="lg:col-span-3 min-w-0" id="chat-hub-center-container">
              
              {/* RENDERING CHATROOM */}
              {chatInnerTab === 'chat' && (
                <div className="bg-[#121824]/35 border border-slate-850 rounded-2xl flex flex-col justify-between h-[520px] overflow-hidden" id="tab-chatroom">
                  
                  {/* Message displays body */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 scroll-smooth">
                    {(messages[selectedCapperId] || []).length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-550 py-10 space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-600 animate-pulse" />
                        <span className="text-xs uppercase font-mono font-bold tracking-wider">No comments in this premium club yet</span>
                      </div>
                    ) : (
                      (messages[selectedCapperId] || []).map((msg) => {
                        const isCapperSender = msg.isCapper || msg.userId === selectedCapperId;
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex gap-3 text-left ${
                              msg.userId === 'u-user-current' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {msg.userId !== 'u-user-current' && (
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-sky-450 text-[10px] shrink-0">
                                {msg.displayName.split(' ').map(n=>n[0]).join('')}
                              </div>
                            )}

                            <div className="max-w-[75%] space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold ${isCapperSender ? 'text-indigo-400 font-extrabold' : 'text-slate-350'}`}>
                                  {msg.displayName}
                                </span>
                                {isCapperSender && (
                                  <span className="text-[8px] bg-indigo-950 text-indigo-300 font-black border border-indigo-900/50 px-1 py-0.5 rounded leading-none shrink-0 font-mono">
                                    CREATOR
                                  </span>
                                )}
                                <span className="text-[9px] text-slate-600 font-mono">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                                msg.userId === 'u-user-current'
                                  ? 'bg-sky-600/90 text-[#121824] rounded-tr-none font-bold'
                                  : isCapperSender
                                  ? 'bg-indigo-950/40 border border-indigo-900/50 text-indigo-200 rounded-tl-none'
                                  : 'bg-slate-900 text-slate-200 rounded-tl-none border border-slate-850/60'
                              }`}>
                                {msg.text}
                              </div>
                            </div>

                            {msg.userId === 'u-user-current' && (
                              <div className="w-8 h-8 rounded-full bg-sky-950 border border-sky-850 flex items-center justify-center font-bold text-sky-400 text-[10px] shrink-0">
                                {msg.displayName.split(' ').map(n=>n[0]).join('')}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Message sending & emoji controls inputs bar */}
                  <form onSubmit={handlePostMessage} className="p-4 border-t border-slate-850 bg-slate-950/40 space-y-3">
                    {/* Fast emoji drawer */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-sm leading-none no-scrollbar">
                      {['🐐', '🔒', '🔥', '💰', '👍', '⚾', '🎯', '👑', '🚨', '🔮'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleAddEmojiToInput(emoji)}
                          className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 rounded-md border border-slate-850 hover:border-slate-800 text-xs transition-transform active:scale-90"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMsgText}
                        onChange={(e) => setNewMsgText(e.target.value)}
                        placeholder={`Message Premium Club as @${profile.username}...`}
                        className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-505 rounded-xl px-4 py-3 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 placeholder-slate-550 outline-none transition-all font-semibold"
                        maxLength={180}
                      />
                      <button
                        type="submit"
                        disabled={!newMsgText.trim()}
                        className="p-3 bg-indigo-600 hover:bg-indigo-500 text-slate-950 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-lg shadow-indigo-600/30"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* RENDERING PREMIUM PARLAYS ONLY */}
              {chatInnerTab === 'parlays' && (
                <div className="space-y-4" id="tab-premium-parlays">
                  <div className="bg-[#121824]/30 border border-slate-855 p-4 rounded-xl text-left flex items-start gap-3">
                    <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Capper Locked Premium Slips</h4>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                        These premium correlated parlay slips have been programmed directly from the **Build Parlay** page with strict subscriber priority constraints enabled. Feel free to react with emojis.
                      </p>
                    </div>
                  </div>

                  {premiumParlays.length === 0 ? (
                    <div className="p-12 text-center bg-slate-900/35 border border-dashed border-slate-850 rounded-2xl text-slate-500">
                      <Sliders className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p className="text-xs uppercase font-mono font-bold tracking-wider">No active premium parlays posted yet</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {premiumParlays.map((parlay) => {
                        const reactions = parlayReactions[parlay.id] || { '🔥': 4, '🎯': 3, '👍': 5, '💰': 6 };
                        return (
                          <div key={parlay.id} className="bg-[#121824]/40 border border-slate-850 rounded-2xl p-5 text-left relative overflow-hidden shadow-xl hover:border-slate-800 transition-all">
                            {/* Parlay premium badge */}
                            <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
                              <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-wider flex items-center gap-1.5 uppercase">
                                <Ticket className="w-4 h-4 text-emerald-400 shrink-0" />
                                {getPublicParlayTitle(parlay.title)}
                              </span>
                              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full font-bold">
                                Wager: {parlay.wagerAmount} units
                              </span>
                            </div>

                            {/* Legs checklist render */}
                            <div className="space-y-2.5">
                              {parlay.legs.map((leg) => (
                                <div key={leg.id} className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-850/50 flex justify-between items-center text-xs">
                                  <div className="space-y-0.5">
                                    <span className="text-[8.5px] font-bold font-mono px-1.5 bg-[#171e30] border border-blue-900/30 text-sky-400 rounded uppercase">
                                      {shouldShowPublicGameLabel(leg.game) ? cleanCustomerText(leg.game) : 'MLB'}
                                    </span>
                                    <p className="font-extrabold text-slate-100 uppercase text-[11px] mt-1">{getPublicLegSelection(leg.selection)}</p>
                                  </div>
                                  <span className="font-mono text-[10px] font-black text-emerald-400">
                                    {(leg.odds > 0) ? `+${decimalToAmerican(leg.odds)}` : decimalToAmerican(leg.odds)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Risk Tier & Payout preview summary indicators block */}
                            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/20 p-3 rounded-xl border border-slate-850/50 font-mono text-[10px]">
                              <div className="flex gap-4">
                                <div>
                                  <span className="block text-[8px] text-slate-500 uppercase">RISK TIER</span>
                                  <strong className={`${parlay.riskTier === 'HIGH' ? 'text-red-400' : parlay.riskTier === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'} font-extrabold`}>
                                    {parlay.riskTier}
                                  </strong>
                                </div>
                                <div>
                                  <span className="block text-[8px] text-slate-500 uppercase">COMBINED ODDS</span>
                                  <strong className="text-white">x{parlay.oddsValue.toFixed(2)} ({parlay.totalOdds})</strong>
                                </div>
                              </div>
                              <div className="text-left md:text-right">
                                <span className="block text-[8px] text-slate-500 uppercase">ESTIMATED SUBSCRIBER PAYOUT</span>
                                <strong className="text-emerald-400 font-black text-sm">${parlay.payoutAmount?.toFixed(2)}</strong>
                              </div>
                            </div>

                            {/* Interactive Reactions list where sub can comment/upvote */}
                            <div className="mt-4 pt-3 border-t border-slate-850/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                              <span className="text-[9px] text-slate-500 uppercase">REACTIONS FOR SUBSCRIBER VERIFIED SLIP</span>
                              <div className="flex items-center gap-2">
                                {Object.entries(reactions).map(([reaction, qty]) => (
                                  <button
                                    key={reaction}
                                    onClick={() => handleReactToParlay(parlay.id, reaction)}
                                    className="p-1 px-3.5 bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-850/60 font-mono text-xs flex items-center gap-2 cursor-pointer transition-colors"
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
                  <div className="bg-[#121824]/30 border border-slate-860 p-4 rounded-xl text-left flex items-start gap-3">
                    <Megaphone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Club Announcements Feed</h4>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                        These official announcements represent the dynamic vouchers and guidelines broadcasted by the capper to alert followers instantly about live value line updates.
                      </p>
                    </div>
                  </div>

                  {selectedCapperId === 'c-user-current' && (
                    <form 
                      onSubmit={(e) => {
                        const target = e.currentTarget.elements.namedItem('announcement_input') as HTMLInputElement;
                        handlePublishAnnouncement(e, target.value);
                        target.value = '';
                      }}
                      className="p-4 bg-slate-900/60 border border-indigo-900/30 rounded-xl space-y-3"
                    >
                      <label className="block text-[9px] text-indigo-400 font-mono font-black uppercase tracking-wider">
                        BROADCAST NEW OFFICIAL CLUB ANNOUNCEMENT
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="announcement_input"
                          name="announcement_input"
                          type="text"
                          placeholder="Type official details or voucher allocation announcement here..."
                          className="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-505 rounded-lg px-3 py-2 text-slate-100 text-xs placeholder-slate-550 outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-650 hover:bg-indigo-550 text-slate-100 text-xs font-mono font-black rounded-lg transition-all"
                        >
                          BROADCAST
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {((announcements[selectedCapperId] || []).length === 0) ? (
                      <div className="p-12 text-center bg-slate-900/35 border border-dashed border-slate-850 rounded-2xl text-slate-505 font-semibold text-xs uppercase font-mono py-12">
                        No official announcements published yet
                      </div>
                    ) : (
                      (announcements[selectedCapperId] || []).map((ann, idx) => (
                        <div key={idx} className="p-4 bg-indigo-950/25 border border-indigo-900/30 rounded-xl text-xs relative overflow-hidden flex items-start gap-3 leading-relaxed font-semibold">
                          <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500" />
                          <Megaphone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-[8.5px] font-mono font-black text-indigo-400">OFFICIAL CREATOR PROOF LINE</span>
                            <p className="text-slate-200">{ann}</p>
                          </div>
                        </div>
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
          <div className="bg-[#121824]/30 border border-slate-850 p-5 rounded-2xl space-y-2">
            <h3 className="text-base font-black uppercase tracking-wide text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              Customize Subscription Offerings
            </h3>
            <p className="text-xs text-slate-400 lines-normal">
              Represent yourself as a high-frequency analyst. Owners have absolute freedom to configure months tiers, customize pricing in credits points to align with model performance indicators, and define exclusive unlockable incentives.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subPlans.map((plan: any, idx: number) => {
              const isEditingThis = editingIndex === idx;
              const durationLabel = plan.months === 1 ? 'Month-to-month' : plan.months === 3 ? '3 Months' : plan.months === 6 ? '6 Months' : '1 Year';

              return (
                <div 
                  key={idx}
                  className="bg-[#121824]/40 border border-slate-850 rounded-2xl p-5 space-y-4 relative flex flex-col justify-between"
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
                          <label className="block text-[9px] text-slate-500 font-mono mb-1">PRICE IN POINTS</label>
                          <input 
                            type="number"
                            value={editPrice}
                            min={1}
                            max={5000}
                            onChange={(e) => setEditPrice(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full bg-slate-950 border border-slate-800 p-2 text-slate-100 text-xs rounded-xl outline-none focus:border-indigo-505"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-500 font-mono mb-1">SAVINGS / DISCOUNT LABEL</label>
                          <input 
                            type="text"
                            value={editPerk}
                            onChange={(e) => setEditPerk(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 p-2 text-slate-100 text-xs rounded-xl outline-none focus:border-indigo-505"
                            placeholder="e.g. Save 10%"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5 pt-1 text-xs">
                        <div>
                          <span className="block text-[8.5px] uppercase text-slate-500 font-mono">Subscription Access Value:</span>
                          <strong className="text-sky-400 font-bold text-base font-mono leading-none">{plan.price} pts</strong>
                        </div>
                        <div>
                          <span className="block text-[8.5px] uppercase text-slate-500 font-mono">Discounts / Value Badge:</span>
                          <span className="text-slate-300 font-extrabold flex items-center gap-1.5 leading-tight">
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                            {plan.savings || plan.perk || 'Standard Rate'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 italic mt-1 font-mono">
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
                          className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 uppercase text-[10px] rounded-lg cursor-pointer font-bold"
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
                        className="w-full py-1.5 bg-[#171e30] border border-blue-900/40 hover:bg-indigo-600 text-sky-400 hover:text-white uppercase text-[10px] font-mono font-bold rounded-lg transition-all"
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
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in text-left" id="subscription-length-modal">
          <div className="bg-[#0b0f19]/95 border border-slate-800 p-6 md:p-8 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-6 text-slate-100 relative">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[9px] bg-indigo-950 text-indigo-400 font-extrabold font-mono px-2.5 py-0.5 rounded-full border border-indigo-900/40 uppercase tracking-widest">
                  Subscriber Club Access
                </span>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mt-1.5">
                  Subscribe to {selectedCapperForSub.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose your subscription length to unlock premium club insights and tools.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowSubModal(false);
                  setSelectedCapperForSub(null);
                }}
                className="text-slate-400 hover:text-slate-100 text-xs font-bold font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all uppercase cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Feature List (above pricing) */}
            <div className="bg-[#121824]/45 border border-slate-850 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-205 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Full club access includes:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
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
                    className="bg-[#121824]/50 border border-slate-800 hover:border-indigo-505/40 p-4 rounded-xl flex flex-col justify-between space-y-4 text-center transition-all duration-200 relative group"
                  >
                    {/* Full access badge */}
                    <div className="absolute -top-2 left-2 right-2 flex justify-center">
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-900/60 rounded-full">
                        Full Club Access Included
                      </span>
                    </div>

                    <div className="space-y-1 pt-2">
                      <span className="block text-xs font-extrabold uppercase tracking-wider text-slate-200">
                        {durationLabel}
                      </span>
                      
                      {(plan.savings || plan.perk) && (
                        <span className="inline-block text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-950/40 text-emerald-450 border border-emerald-900/30 rounded-md">
                          {plan.savings || plan.perk}
                        </span>
                      )}

                      <div className="flex items-baseline justify-center gap-1 pt-1">
                        <span className="text-2xl font-black text-sky-400 font-mono">{plan.price}</span>
                        <span className="text-[10px] text-slate-500 font-mono">pts</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="block text-[9px] text-slate-550 font-semibold leading-normal">
                        {plan.note || 'Renews automatically. Cancel anytime.'}
                      </span>

                      <button
                        onClick={() => {
                          handleSubscribe(selectedCapperForSub, plan.price, durationLabel);
                          setShowSubModal(false);
                          setSelectedCapperForSub(null);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-slate-100 font-bold text-xs rounded-lg transition-all transform hover:scale-[1.02] shadow-md cursor-pointer"
                      >
                        Subscribe
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Disclaimer & Balance Indicator */}
            <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono border-t border-slate-900 pt-4 gap-2">
              <span>Your credit balance: <strong className="text-indigo-400 font-bold">{credits} pts</strong></span>
              <span>All subscriptions are processed instantly</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
