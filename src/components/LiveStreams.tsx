import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Users, 
  Send, 
  Zap, 
  Video, 
  VideoOff, 
  BarChart2, 
  Mic, 
  Volume2, 
  Settings, 
  Radio, 
  Flame, 
  Award, 
  Monitor, 
  Smile, 
  CheckCircle, 
  Plus, 
  Sliders, 
  MessageSquare,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Clock,
  ChevronLeft,
  ThumbsUp,
  SlidersHorizontal,
  Activity,
  Award as TrophyIcon,
  Lock
} from 'lucide-react';
import { Vouch } from '../types';
import { getFounderPointsLabel } from "../lib/founderAccess";

interface LiveStreamsProps {
  onSaveVouch: (vouch: Vouch) => void;
  savedVouchIds: string[];
  profile: any;
  onPostCreated?: (post: any) => void;
  onSectionChange: (section: string) => void;
}

interface StreamChannel {
  id: string;
  streamerName: string;
  streamerUsername: string;
  avatarInitials: string;
  avatarColor: string;
  title: string;
  gameName: string;
  sport: string;
  viewers: number;
  winRate: number;
  liveSlipOdds: string;
  liveSlipMarket: string;
  liveSlipSelection: string;
  liveSlipGame: string;
  isVerified: boolean;
  videoPlaceholderTheme: 'neon-pitch' | 'cyber-terminal' | 'sabermetrics-chart' | 'gold-parlay';
  pollQuestion: string;
  pollOptions: { label: string; votes: number }[];
}

const CHANNELS: StreamChannel[] = [
  {
    id: 'ch-guru',
    streamerName: 'Stream Demo 1',
    streamerUsername: 'sharp_guru_pro',
    avatarInitials: 'SG',
    avatarColor: 'bg-indigo-600',
    title: 'Live MLB research stream · Demo',
    gameName: 'Los Angeles Dodgers @ San Francisco Giants',
    sport: 'MLB',
    viewers: 1420,
    winRate: 0,
    liveSlipOdds: '+185',
    liveSlipMarket: 'Dodgers Runline Handicap',
    liveSlipSelection: 'Dodgers -1.5 Runs',
    liveSlipGame: 'Padres @ Dodgers',
    isVerified: true,
    videoPlaceholderTheme: 'neon-pitch',
    pollQuestion: 'Will Shohei Ohtani hit a Home Run next plate appearance?',
    pollOptions: [
      { label: 'Yes (+310)', votes: 142 },
      { label: 'No (-450)', votes: 298 }
    ]
  },
  {
    id: 'ch-sabermetrician',
    streamerName: 'Stream Demo 2',
    streamerUsername: 'sabermetrics_pro',
    avatarInitials: 'SP',
    avatarColor: 'bg-teal-600',
    title: '🧠 AI Machine-Learning Strikeout Prop Tracker - All Friday Slates 🧠',
    gameName: 'New York Yankees @ Boston Red Sox',
    sport: 'MLB',
    viewers: 935,
    winRate: 0,
    liveSlipOdds: '+115',
    liveSlipMarket: 'Pitcher Total Strikeouts',
    liveSlipSelection: 'Tanner Houck Over 6.5 Ks',
    liveSlipGame: 'Yankees @ Red Sox',
    isVerified: true,
    videoPlaceholderTheme: 'sabermetrics-chart',
    pollQuestion: 'Will the total game runs go OVER 8.5?',
    pollOptions: [
      { label: 'Yes - Over 8.5', votes: 210 },
      { label: 'No - Under 8.5', votes: 115 }
    ]
  },
  {
    id: 'ch-wind',
    streamerName: 'Stream Demo 3',
    streamerUsername: 'wrigley_wind_tracker',
    avatarInitials: 'WW',
    avatarColor: 'bg-orange-600',
    title: '💨 Live Chicago Windy City Analytics & Over/Under Live Vouching 💨',
    gameName: 'Chicago Cubs @ Atlanta Braves',
    sport: 'MLB',
    viewers: 512,
    winRate: 0,
    liveSlipOdds: '-110',
    liveSlipMarket: 'Alternative Game Total Runs',
    liveSlipSelection: 'Under 7.5 Total Runs',
    liveSlipGame: 'Cubs @ Braves',
    isVerified: false,
    videoPlaceholderTheme: 'cyber-terminal',
    pollQuestion: 'Are atmospheric wind gusts blowing directly IN or OUT on Cubs?',
    pollOptions: [
      { label: 'Blowing Outwards (Favor Over)', votes: 94 },
      { label: 'Blowing Inwards (Favor Under)', votes: 186 }
    ]
  },
  {
    id: 'ch-parlay-queen',
    streamerName: 'Stream Demo 4',
    streamerUsername: 'stream_demo_4',
    avatarInitials: 'PQ',
    avatarColor: 'bg-pink-600',
    title: '💸 High Yield Risk Sweep: 3-Leg MLB Home Run Slip Sweeper! 💸',
    gameName: 'Houston Astros @ Texas Rangers',
    sport: 'MLB',
    viewers: 820,
    winRate: 0,
    liveSlipOdds: '+425',
    liveSlipMarket: 'To Hit A Home Run',
    liveSlipSelection: 'Yordan Alvarez HR',
    liveSlipGame: 'Astros @ Rangers',
    isVerified: true,
    videoPlaceholderTheme: 'gold-parlay',
    pollQuestion: 'Will Yordan Alvarez cash our +425 HR slip in next inning?',
    pollOptions: [
      { label: 'Absolutely (LFG)', votes: 184 },
      { label: 'High risk (Bail out)', votes: 92 }
    ]
  }
];

const MOCK_CHAT_POOL = [
  "LFG tonight!",
  "Tailing this research, good breakdown",
  "Ohtani looks locked in tonight boys.",
  "What is the confidence meter on Tanner Houck?",
  "Those sabermetric strikeout tables are pure gold",
  "Wait, didn't Red Sox bullpen blow the last game?",
  "Demo chat — stream integration in development",
  "Sample chat message for layout testing",
  "Just vouched this to my research board!",
  "Great analysis W",
  "Can someone explain why Houck is valued here?",
  "This stream is a demo preview",
  "Saved this to my parlay slip",
  "Demo chat — no real messages yet",
  "The HR board called this one earlier too"
];

const STREAMER_CHAT_RESPONSES = [
  "Appreciate you following along! Let's track this together.",
  "Check the live analytics radar, the value is on our side.",
  "Track responsibly — this is research, not a guarantee.",
  "Yes, the odds are backed by the live VouchEdge pitch tracking coefficients.",
  "Glad you like the live board overlay! Remember to save it directly into your ledger tab."
];

export default function LiveStreams({ 
  onSaveVouch, 
  savedVouchIds, 
  profile, 
  onPostCreated,
  onSectionChange 
}: LiveStreamsProps) {
  const [activeTab, setActiveTab] = useState<'watch' | 'go-live'>('watch');
  const [activeChannel, setActiveChannel] = useState<StreamChannel | null>(null); // starts null so we see "Who's Streaming Now"
  
  // Streaming Chat Log
  const [chats, setChats] = useState<{ id: string; user: string; text: string; role?: string }[]>([
    { id: '1', user: 'VouchEdge_Bot', text: 'Welcome to VouchEdge Interactive Live Screen Room! Click overlay buttons to instant-vouch streaming slips.', role: 'mod' }
  ]);
  const [userChatMsg, setUserChatMsg] = useState('');
  
  // User Webcam Setup
  const [isUserLive, setIsUserLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState('MLB research stream · Demo');
  const [activeGameCover, setActiveGameCover] = useState('Los Angeles Dodgers @ San Francisco Giants');
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [userStreamViewers, setUserStreamViewers] = useState(0);
  const [micState, setMicState] = useState(true);
  const [screenShareSimulated, setScreenShareSimulated] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);

  // Poll state
  const [pollVotes, setPollVotes] = useState<number[]>([100, 100]);
  const [hasVoted, setHasVoted] = useState(false);

  // Emojis & Tipping states
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; char: string; left: number }[]>([]);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState<number>(25);

  const handleTriggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const left = 10 + Math.random() * 80; // random percentage
    setFloatingEmojis(prev => [...prev, { id, char: emoji, left }]);
    
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(item => item.id !== id));
    }, 2500);

    setChats(prev => [
      ...prev,
      {
        id: `react-${id}`,
        user: profile.username || 'user_bettor',
        text: `Sent reaction [ ${emoji} ] to the live feed!`,
        role: 'self'
      }
    ]);

    if (activeChannel) {
      setTimeout(() => {
        const responses = [
          `Appreciate the support! Let's keep hunting these green parlays! ${emoji}`,
          `Energy is unreal! Vouch locked! 🚀`,
          `LFG! That's what we want to see in the tracker !`,
          `Ayyyy! Let's ride! 🔥`
        ];
        const res = responses[Math.floor(Math.random() * responses.length)];
        setChats(prev => [
          ...prev,
          {
            id: `react-reply-${Date.now()}`,
            user: activeChannel.streamerUsername,
            text: res,
            role: 'broadcaster'
          }
        ]);
      }, 1500);
    }
  };

  const handleDonate = (amount: number) => {
    const websiteFee = parseFloat((amount * 0.15).toFixed(2));
    const creatorNet = parseFloat((amount * 0.85).toFixed(2));

    const id = Date.now();
    setChats(prev => [
      ...prev,
      {
        id: `tip-${id}`,
        user: 'VouchEdge_Bot',
        text: `💰 STREAM CONGRATS: @${profile.username} tipped $${amount.toFixed(2)} to the stream! (Website 15% fee: $${websiteFee}, Broadcaster 85% share: $${creatorNet}) 🪙`,
        role: 'mod'
      }
    ]);

    // Rain gold coins
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        setFloatingEmojis(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            char: '🪙',
            left: Math.random() * 90
          }
        ]);
      }, i * 65);
    }

    setShowTipModal(false);
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto Scroll Chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  // Simulated Live Viewers fluctuation
  useEffect(() => {
    if (!activeChannel) return;
    const interval = setInterval(() => {
      setActiveChannel(curr => {
        if (!curr) return null;
        const change = Math.floor(Math.random() * 9) - 4; // -4 to +4
        return {
          ...curr,
          viewers: Math.max(10, curr.viewers + change)
        };
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [activeChannel]);

  // Simulated Stream Duration for Go-Live Desk
  useEffect(() => {
    let interval: any = null;
    if (isUserLive) {
      interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
        setUserStreamViewers(prev => {
          const change = Math.floor(Math.random() * 11) - 3; // skewed upward
          return Math.max(1, prev + change);
        });
      }, 1000);
    } else {
      setStreamDuration(0);
      setUserStreamViewers(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isUserLive]);

  // Simulating live chat comments from the active pool of watching channels
  useEffect(() => {
    if (!activeChannel || activeTab !== 'watch') return;
    const interval = setInterval(() => {
      const randomUser = [
        'parlay_king_99', 'mlb_tracker', 'sharp_prop_guy', 'sabermetrics_nerd', 'slam_boston', 
        'dodger_diehard', 'wind_analyst_0', 'vouchedge_fan_1', 'bettor_babe', 'wicked_sweep'
      ][Math.floor(Math.random() * 10)];
      const randomText = MOCK_CHAT_POOL[Math.floor(Math.random() * MOCK_CHAT_POOL.length)];
      setChats(prev => [
        ...prev,
        { id: `chat-auto-${Date.now()}`, user: randomUser, text: randomText }
      ].slice(-100)); // keep last 10
    }, 2800);

    return () => clearInterval(interval);
  }, [activeChannel, activeTab]);

  // Simulating live chat comments for user "Go-Live" Streamer
  useEffect(() => {
    if (!isUserLive || activeTab !== 'go-live') return;
    const interval = setInterval(() => {
      const userList = [
        'prop_spotter', 'green_ledger_master', 'sabermetrics_tail', 'mlb_fan_chic', 'circle_vouch_tailer',
        'sharp_dodger_7', 'wicked_sweeper_ma', 'parlay_prophet_10', 'bankroll_shield'
      ];
      const selectedUser = userList[Math.floor(Math.random() * userList.length)];
      
      const customChats = [
        `Let's go @${profile.username}! What matchup are you researching?`,
        `Tailing whatever is on that VouchEdge deck !`,
        `Let us cash! Standard 2 units on this !`,
        `That win rate verified banner is gorgeous`,
        `Vouched directly back to my home ledger`,
        `Your pitch correlation models look spectacular`,
        `Is this Dodgers game finished or live?`,
        `W streamers! VouchEdge has the absolute best custom circle studio!`
      ];

      const selectedText = customChats[Math.floor(Math.random() * customChats.length)];
      setChats(prev => [
        ...prev,
        { id: `chat-user-stream-${Date.now()}`, user: selectedUser, text: selectedText }
      ].slice(-100));
    }, 4000);

    return () => clearInterval(interval);
  }, [isUserLive, activeTab, profile]);

  // Reset chat when swapping channels
  useEffect(() => {
    if (activeChannel) {
      setChats([
        { id: '1', user: 'VouchEdge_Bot', text: `Welcome to ${activeChannel.streamerName}'s Live Lobby. Chat politely and track sports transparently.`, role: 'mod' },
        { id: '2', user: activeChannel.streamerUsername, text: 'Welcome in guys! The game is locked in. Let\'s make some profit. Leave your questions here.', role: 'broadcaster' }
      ]);
      setPollVotes(activeChannel.pollOptions.map(o => o.votes));
      setHasVoted(false);
    }
  }, [activeChannel]);

  // User chat send
  const sendUserChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userChatMsg.trim()) return;

    const newMsg = {
      id: `chat-user-${Date.now()}`,
      user: profile.username || 'user_bettor',
      text: userChatMsg,
      role: 'self'
    };

    setChats(prev => [...prev, newMsg]);
    const tempMsg = userChatMsg;
    setUserChatMsg('');

    // Trigger funny bot reply simulation
    if (activeTab === 'watch' && activeChannel) {
      setTimeout(() => {
        const matchingResponse = STREAMER_CHAT_RESPONSES[Math.floor(Math.random() * STREAMER_CHAT_RESPONSES.length)];
        setChats(prev => [
          ...prev,
          { id: `chat-streamer-reply-${Date.now()}`, user: activeChannel.streamerUsername, text: `@${profile.username} ${matchingResponse}`, role: 'broadcaster' }
        ]);
      }, 1500);
    } else if (isUserLive) {
      setTimeout(() => {
        const positiveReactions = [
          "Yes sir! Preach!",
          "Agreed fully. Vouch is locked inside the ledger.",
          "W analysis @${profile.username}!",
          "Already hit that active tail button!",
          "Let's ride !!"
        ];
        const randomReaction = positiveReactions[Math.floor(Math.random() * positiveReactions.length)].replace('${profile.username}', profile.username);
        setChats(prev => [
          ...prev,
          { id: `chat-viewer-reply-${Date.now()}`, user: 'sabermetrics_tail', text: randomReaction }
        ]);
      }, 1200);
    }
  };

  // Webcam stream handlers
  const handleToggleWebcam = async () => {
    if (webcamEnabled) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      mediaStreamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setWebcamEnabled(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setWebcamEnabled(true);
      } catch (err) {
        console.warn("Could not activate camera. Using static fallback.", err);
        setWebcamEnabled(true); // Treat as virtual camera fallback
      }
    }
  };

  const handleStartUserStream = () => {
    setIsUserLive(true);
    setUserStreamViewers(58); // start with 58 viewers
    setChats([
      { id: '1', user: 'VouchEdge_Bot', text: '🔴 Stream started successfully. You are now broadcasting live over VouchEdge Local Circle Stream Arena!', role: 'mod' },
      { id: '2', user: 'prop_spotter', text: 'Let\'s go! @' + profile.username + ' is live broadcasting!' }
    ]);
  };

  const handleStopUserStream = () => {
    setIsUserLive(false);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    mediaStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamEnabled(false);
  };

  // Poll Voter
  const handleVotePoll = (index: number) => {
    if (hasVoted) return;
    setPollVotes(prev => {
      const updated = [...prev];
      updated[index] += 1;
      return updated;
    });
    setHasVoted(true);
  };

  // Quick Vouch action from Overlay
  const handleQuickVouchOverlay = (chan: StreamChannel) => {
    const vouchId = `vouch-live-stream-${chan.id}`;
    if (savedVouchIds.includes(vouchId)) {
      alert("You have already vouched this live parlay prop!");
      return;
    }

    const liveVouch: Vouch = {
      id: vouchId,
      vouchSource: chan.streamerName,
      userNote: `Quick tail from Streamer live video analysis segment. Highly correlated pitch metrics.`,
      market: chan.liveSlipMarket,
      sport: chan.sport,
      playerOrTeam: chan.liveSlipSelection.split(' ').slice(0, 2).join(' '),
      gameName: chan.liveSlipGame,
      odds: chan.liveSlipOdds,
      status: 'PENDING',
      savedCount: 52,
      vouchedCount: 53,
      createdAt: new Date().toISOString()
    };

    onSaveVouch(liveVouch);

    // Also automatically publish to feed!
    if (onPostCreated) {
      onPostCreated({
        content: `🔴 [LIVE STREAM TAIL] Just tailed prop from @${chan.streamerUsername}'s broadcast!\n\nSelection: ${chan.liveSlipSelection}\nOdds: ${chan.liveSlipOdds}\nAnalysis: Vouched live in real-time from Twitch-style Interactive Stream Arena. Let's sweep this!`,
        postType: 'VOUCH',
        sportBadge: chan.sport,
        sourceBadge: 'Live Stream Tail',
        vouch: liveVouch
      });
    }

    alert(`🎉 Successfully Vouched & Tailed @${chan.streamerUsername}'s live prop! Saved to your active deck and automatically published to your profile ledger.`);
  };

  const formatSecs = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleJoinChannelClick = (chan: StreamChannel) => {
    setActiveChannel(chan);
  };

  const handleBackToLobby = () => {
    setActiveChannel(null);
  };

  const isPro = profile.subscriptionTier && profile.subscriptionTier !== 'BASIC';

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto min-h-screen bg-transparent space-y-6" id="livestream-arena-outer-component">
      
      {/* Upper header title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-850 pb-5" id="streamer-lobby-header-nav">
        <div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse shrink-0" />
            Twitch Live Arena & Channels
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Observe verified sports streams, interact with dynamic Twitch chat, tail active live formulas, or go live yourself!
          </p>
        </div>

        {/* Tab Swapping Mode Controls */}
        <div className="flex bg-[hsl(var(--ve-surface-raised)/0.44)] p-1 rounded-xl border border-[hsl(var(--ve-border)/0.32)] self-start" id="tab-controls-livestreams">
          <button
            onClick={() => {
              setActiveTab('watch');
              setActiveChannel(null); // return to landing lobby
            }}
            className={`px-4.5 py-1.5 rounded-lg text-xs font-black tracking-wide uppercase transition-all flex items-center gap-2 ${
              activeTab === 'watch'
                ? 'bg-gradient-to-tr from-[hsl(var(--ve-accent-cyan))] to-[hsl(var(--ve-accent-violet))] text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            Watch Channels
          </button>
          
          <button
            onClick={() => setActiveTab('go-live')}
            className={`px-4.5 py-1.5 rounded-lg text-xs font-black tracking-wide uppercase transition-all flex items-center gap-2 ${
              activeTab === 'go-live'
                ? 'bg-gradient-to-tr from-rose-600 to-pink-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5 animate-pulse text-rose-455" />
            Go Live (Streamer Desk)
          </button>
        </div>
      </div>

      {!isPro ? (
        <div className="bg-[hsl(var(--ve-surface-raised)/0.34)] backdrop-blur-md rounded-2xl border border-[hsl(var(--ve-border)/0.34)] p-8 md:p-14 text-center max-w-2xl mx-auto space-y-6 relative overflow-hidden shadow-2xl my-8 text-left" id="streams-premium-blocked-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--ve-accent-violet)/0.12)] rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--ve-surface-raised)/0.50)] border border-[hsl(var(--ve-border)/0.36)] flex items-center justify-center mx-auto text-[hsl(var(--ve-accent-violet))] shadow-lg animate-pulse">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-3 text-center">
            <h3 className="text-xl font-black text-slate-100 uppercase tracking-wide">
              🔒 Live Streams & Broadcasting are Reserved for PRO Tiers
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto font-medium">
              Watch professional sports cappers lock dynamic live slips onto the Vouch-ledger in real-time, ask detailed model questions on Twitch-style audio desks, and trigger dynamic emoji interactions.
            </p>
            <div className="p-3.5 bg-[hsl(var(--ve-surface-raised)/0.38)] rounded-xl border border-[hsl(var(--ve-border)/0.30)] font-mono text-[10.5px] text-slate-400 max-w-lg mx-auto text-center space-y-1">
              <span className="text-amber-400 font-bold uppercase tracking-wide block">💡 Dynamic Creator Economy Support:</span>
              <span>Our platform takes a flat 15% service fee on donations; the other 85% goes directly to support transparent capping creators!</span>
            </div>
          </div>
          <div className="pt-2 text-center">
            <button
              onClick={() => onSectionChange('premium')}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-550 text-white font-black text-xs rounded-xl tracking-wider uppercase shadow-xl transition-all hover:scale-105"
            >
              Unlock PRO Premium Tiers Now 💎
            </button>
          </div>
        </div>
      ) : activeTab === 'watch' ? (
        activeChannel === null ? (
          // ================= ANYONE STREAMING NOW PAGE (LOBBY FIRST) =================
          <div className="space-y-6 animate-fade-in" id="anyone-streaming-now-landing">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                  Live Streamers Online Now
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                ⭐ {CHANNELS.length} Active Feeds
              </span>
            </div>

            {/* Main Interactive Grid of Stream Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="streams-lobby-grid">
              {CHANNELS.map((chan) => (
                <div
                  key={chan.id}
                  onClick={() => handleJoinChannelClick(chan)}
                  className="bg-[#121824] rounded-2xl border border-slate-850 overflow-hidden hover:border-slate-700 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between group h-full"
                >
                  {/* Miniature Image / Graphics Video-Placeholder overlay */}
                  <div className="aspect-[16/9] w-full bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
                    {/* Live indicator badge */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-red-950/80 px-2.5 py-1 rounded-md border border-red-900/40 text-[9px] font-mono text-red-400 font-bold uppercase tracking-widest leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                      Live
                    </div>

                    {/* Viewer badge */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded text-[10px] font-mono text-slate-200 leading-none">
                      <Users className="w-3 h-3 text-[var(--ve-accent)]" />
                      <span>{chan.viewers.toLocaleString()}</span>
                    </div>

                    {/* Miniature Theme View previews */}
                    {chan.videoPlaceholderTheme === 'neon-pitch' && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#05070f] to-[#101930] flex items-center justify-center pb-3">
                        <div className="w-16 h-16 border-2 border-dashed border-sky-500/20 rounded-full flex items-center justify-center relative">
                          <span className="absolute w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                        </div>
                      </div>
                    )}
                    {chan.videoPlaceholderTheme === 'sabermetrics-chart' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#02050b] to-[#091122] flex items-end justify-center gap-1.5 p-6 pb-2">
                        <div className="w-5 bg-sky-500/20 border border-sky-500/40 rounded-t h-8" />
                        <div className="w-5 bg-teal-500/35 border border-teal-500/50 rounded-t h-12" />
                        <div className="w-5 bg-indigo-500/25 border border-indigo-500/40 rounded-t h-6" />
                        <div className="w-5 bg-rose-500/20 border border-rose-500/35 rounded-t h-16" />
                      </div>
                    )}
                    {chan.videoPlaceholderTheme === 'cyber-terminal' && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#02050e] to-[#0b101f] flex items-center justify-center pb-3 text-[#ff9f43] text-xs font-mono">
                        <Activity className="w-8 h-8 animate-pulse text-[#ff9f43]" />
                      </div>
                    )}
                    {chan.videoPlaceholderTheme === 'gold-parlay' && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#0b0c10] to-[#1a1403] flex items-center justify-center pb-3 text-amber-500 text-xs font-mono">
                        <TrophyIcon className="w-8 h-8 animate-bounce text-amber-500" />
                      </div>
                    )}

                    {/* Click CTA info */}
                    <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10 backdrop-blur-sm">
                      <div className="bg-sky-500 text-slate-950 font-black tracking-wide uppercase text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5">
                        <Tv className="w-4 h-4" />
                        Join Live Stream
                      </div>
                    </div>
                  </div>

                  {/* Channel Description Panel */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                    <div>
                      <div className="flex gap-2 items-center">
                        <div className={`w-7 h-7 rounded-full ${chan.avatarColor} font-bold text-slate-200 text-xs flex items-center justify-center shrink-0`}>
                          {chan.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-extrabold text-xs text-slate-200 truncate">{chan.streamerName}</span>
                            {chan.isVerified && <CheckCircle className="w-3.5 h-3.5 text-sky-400 fill-[var(--ve-accent)]" />}
                          </div>
                          <span className="text-[10px] text-slate-500">@{chan.streamerUsername}</span>
                        </div>
                      </div>

                      <h4 className="font-black text-slate-200 text-xs mt-2.5 text-left leading-snug line-clamp-2 uppercase tracking-wide group-hover:text-sky-400 transition-colors">
                        {chan.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 text-left mt-1">
                        🏈 Covering: <span className="text-slate-202 font-mono">{chan.gameName}</span>
                      </p>
                    </div>

                    {/* Vouch preview overlay box */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex items-center justify-between text-left">
                      <div className="min-w-0">
                        <span className="text-[8px] bg-amber-950/40 text-amber-400 border border-amber-900/30 px-1.5 py-0.2 rounded font-mono uppercase tracking-wider font-semibold">Live Slip</span>
                        <p className="text-[11px] font-bold text-slate-300 truncate mt-0.5">{chan.liveSlipSelection}</p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-amber-400">{chan.liveSlipOdds}</span>
                        <p className="text-[8px] text-slate-500 uppercase mt-0.5">odds</p>
                      </div>
                    </div>
                  </div>

                  {/* Stat bar */}
                  <div className="px-4 py-3 bg-slate-950/40 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span className="text-emerald-400 font-bold">★ {chan.winRate}% stats</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // prevent opening channel
                        handleQuickVouchOverlay(chan);
                      }}
                      className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 text-slate-300 px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 transition-colors"
                    >
                      <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> Vouch Pin
                    </button>
                  </div>

                </div>
              ))}
            </div>

            {/* Empty landing tip */}
            <div className="p-5.5 bg-slate-900/30 rounded-2xl border border-slate-850 text-center text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              💡 <strong>Streaming Interactive Arena</strong>: Selecting any channel above opens a professional Twitch Theater suite. Watch simulated sports correlation feeds, chat with active community members, and instant-vouch streaming betting slips in a click.
            </div>
          </div>
        ) : (
          // ================= TWITCH-STYLE INDIVIDUAL COMPONENT THEATER VIEW =================
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="watch-grid-layout">
            
            {/* Active Player and channel column */}
            <div className="lg:col-span-8 space-y-5" id="active-videoplayer-column">
              
              {/* Back to lobby navigation */}
              <button
                onClick={handleBackToLobby}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors uppercase font-bold tracking-wider"
                id="back-to-streams-lobby-btn"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Streams Directory</span>
              </button>

              <div className="bg-[#121824] rounded-2xl border border-slate-850 overflow-hidden shadow-2xl relative" id="theater-frame-inner">
                
                {/* 1. Live Screen Video Canvas Mockup */}
                <div className="aspect-video w-full bg-slate-950 relative flex items-center justify-center overflow-hidden border-b border-slate-850" id="live-player-video-canvas">
                  
                  {/* Dynamic Stream Graphic Placeholders mapping wind, analytics stats, or game telemetry */}
                  {activeChannel.videoPlaceholderTheme === 'neon-pitch' && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#05070f] via-[#101930] to-[#04091a] flex flex-col justify-between p-6 select-none animate-fade-in">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-900/40 flex items-center gap-1 uppercase tracking-widest animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Broadcast
                        </span>
                        <div className="flex gap-2 text-slate-400 font-mono text-[10px] bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded">
                          <Clock className="w-3 h-3 text-sky-400 shrink-0" />
                          <span>STRETCH ANALYSIS: TOP 7TH</span>
                        </div>
                      </div>

                      {/* Interactive Animated Baseball Pitch Simulator Canvas */}
                      <div className="flex flex-col items-center justify-center space-y-3 shrink-0 py-8 relative">
                        {/* Radar grid lines */}
                        <div className="absolute w-52 h-52 bg-slate-950/45 rounded-full border border-sky-500/20 animate-pulse flex items-center justify-center">
                          <div className="w-36 h-36 rounded-full border border-sky-500/10 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full border border-sky-500/5" />
                          </div>
                        </div>

                        {/* Simulated Pitch Radar Box */}
                        <div className="w-40 h-40 bg-[#090d16]/75 border-2 border-dashed border-sky-500/45 rounded-xl flex items-center justify-center relative p-2 shadow-inner">
                          {/* Strikezone */}
                          <div className="w-24 h-28 border border-emerald-500/45 rounded flex items-center justify-center relative bg-emerald-500/[0.02]">
                            {/* Interactive Target cursor */}
                            <span className="absolute w-3 h-3 bg-rose-500 rounded-full animate-ping top-10 left-12"></span>
                            <span className="absolute w-2.5 h-2.5 bg-rose-500 rounded-full top-10 left-12 border border-white"></span>
                            
                            {/* Pitch telemetry */}
                            <p className="text-[9px] font-mono text-emerald-400 absolute bottom-1 text-center bg-slate-950/95 px-1.5 rounded">SWEPT: 93.4 MPH</p>
                          </div>
                        </div>
                        <div className="text-center z-10">
                          <p className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Dodgers Strikezone Radar</p>
                          <p className="text-[10px] text-slate-450 mt-0.5 font-mono">Live correlation factor: 98.4% Pitch Efficiency</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-slate-950/70 p-3 rounded-lg border border-slate-850">
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-orange-400 shrink-0 animate-bounce" />
                          <span className="text-[10px] font-bold text-slate-300 uppercase leading-none font-mono">Strike Rate Sweep Coefficient</span>
                        </div>
                        <span className="text-xs font-bold font-mono text-[var(--ve-accent)] bg-sky-950/60 border border-sky-900/40 px-2 py-0.5 rounded leading-none">+32.4% vs LHB</span>
                      </div>
                    </div>
                  )}

                  {activeChannel.videoPlaceholderTheme === 'sabermetrics-chart' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#02050b] via-[#091122] to-[#040a1b] flex flex-col justify-between p-6 select-none animate-fade-in">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold font-mono text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded border border-teal-900/40 flex items-center gap-1 uppercase tracking-widest animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span> Saber-Stream Live
                        </span>
                        <div className="flex gap-2 text-slate-400 font-mono text-[10px] bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded">
                          <BarChart2 className="w-3.5 h-3.5 text-teal-450 shrink-0" />
                          <span>PROJECTION MODEL GRID</span>
                        </div>
                      </div>

                      {/* Math charts and graphs */}
                      <div className="flex flex-col items-center justify-center space-y-4 py-8">
                        <div className="w-64 h-24 flex items-end justify-between gap-2.5 px-4 relative">
                          {/* Grid horizontal markers */}
                          <div className="absolute left-0 right-0 h-0.5 border-b border-slate-800/80 top-1/4"></div>
                          <div className="absolute left-0 right-0 h-0.5 border-b border-slate-800/80 top-2/4"></div>
                          <div className="absolute left-0 right-0 h-0.5 border-b border-slate-800/80 top-3/4"></div>

                          {/* Dynamic Bars */}
                          <div className="w-8 bg-sky-500/20 border border-sky-500/40 rounded-t h-16 animate-pulse flex items-center justify-center font-mono text-[8px] text-sky-400 font-bold pb-1">5.2K</div>
                          <div className="w-8 bg-teal-500/25 border border-teal-500/45 rounded-t h-20 animate-pulse flex items-center justify-center font-mono text-[8px] text-teal-400 font-bold pb-1">6.8K</div>
                          <div className="w-8 bg-indigo-500/30 border border-indigo-500/40 rounded-t h-12 flex items-center justify-center font-mono text-[8px] text-indigo-400 font-bold pb-1">4.1K</div>
                          <div className="w-8 bg-rose-500/20 border border-rose-500/35 rounded-t h-24 animate-pulse flex items-center justify-center font-mono text-[8px] text-rose-455 font-bold pb-1">7.9K</div>
                          <div className="w-8 bg-emerald-500/25 border border-emerald-500/40 rounded-t h-14 flex items-center justify-center font-mono text-[8px] text-emerald-400 font-bold pb-1">4.8K</div>
                        </div>

                        <div className="text-center space-y-1">
                          <p className="text-xs font-bold text-slate-100 uppercase tracking-widest font-mono">strikeout decay model distribution</p>
                          <p className="text-[10px] text-slate-500 font-mono">Alpha Beta Regression Vector: 0.884 Coefficient Ratio</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-slate-950/70 p-3 rounded-lg border border-teal-950/40 text-xs font-mono">
                        <span className="text-slate-400">Total Simulation Passes</span>
                        <span className="font-bold text-teal-450">100,000 runs</span>
                      </div>
                    </div>
                  )}

                  {activeChannel.videoPlaceholderTheme === 'cyber-terminal' && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#02050e] via-[#0b101f] to-[#010611] flex flex-col justify-between p-6 select-none animate-fade-in font-mono">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-950/80 px-2.5 py-0.5 rounded border border-orange-900/40 flex items-center gap-1 uppercase tracking-widest animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping"></span> Live wind tracking
                        </span>
                        <div className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                          <span>WRIGLEY FIELD WEATHER BOARD</span>
                        </div>
                      </div>

                      {/* Cyber scan lines terminal grid */}
                      <div className="flex flex-col items-center justify-center space-y-3 py-6 relative">
                        {/* Interactive concentric circle dials */}
                        <div className="w-24 h-24 border-4 border-[#ff9f43]/20 border-t-[#ff9f43] rounded-full animate-spin flex items-center justify-center text-[#ff9f43] text-sm font-bold">
                          24 MPH
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-xs font-bold text-slate-200 uppercase tracking-widest text-[#ff9f43]">Live Chicago Wind Gust Angle</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                            Wind blowing directly south-west at 14.5 degrees. Alternative Under betting margin is optimal.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-slate-950/75 p-3 rounded-lg border border-slate-850">
                        <span className="text-[10px] text-slate-450 uppercase">Atmospheric air pressure level</span>
                        <span className="text-xs font-bold text-[#ff9f43]">1014.5 hPa (Optimal Under)</span>
                      </div>
                    </div>
                  )}

                  {activeChannel.videoPlaceholderTheme === 'gold-parlay' && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#0b0c10] via-[#211a05] to-[#040409] flex flex-col justify-between p-6 select-none animate-fade-in font-mono">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-955 px-2.5 py-0.5 rounded border border-amber-900/40 flex items-center gap-1 uppercase tracking-widest animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span> Gold Sweep Live
                        </span>
                        <div className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                          <span>PARLAY PROBABILITY DECKS</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center space-y-3 py-6 relative">
                        <TrophyIcon className="w-14 h-14 text-amber-450 animate-bounce" />
                        <div className="text-center space-y-1">
                          <p className="text-xs font-bold text-slate-100 uppercase tracking-widest text-amber-500">HOMER SWEETS CORRELATION</p>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Astros batter profiles match right-field short fence in Arlington!
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-slate-950/75 p-3 rounded-lg border border-slate-850">
                        <span className="text-[10px] text-slate-400">Launch Angle Probability Code</span>
                        <span className="text-xs font-bold text-amber-500">82.4% Optimal Barrel Chance</span>
                      </div>
                    </div>
                  )}

                  {/* Volume Control Overlay & Settings segment */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-slate-100 bg-slate-950/70 py-1.5 px-3 rounded-lg border border-slate-805 z-10 select-none">
                    <div className="flex items-center gap-2">
                      <button className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-850">
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">Stream sound: Live</span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.2 border border-emerald-900/25 rounded">
                        ● 1080P PRO
                      </span>
                      <button className="text-slate-500 hover:text-white transition-colors">
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Float Emoji System Container Overlay */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 select-none">
                    <style>{`
                      @keyframes floatUpEmoji {
                        0% {
                          transform: translateY(110%) scale(0.6) rotate(0deg);
                          opacity: 0;
                        }
                        10% {
                          opacity: 1;
                          transform: translateY(80%) scale(1.3) rotate(-5deg);
                        }
                        90% {
                          opacity: 0.9;
                        }
                        100% {
                          transform: translateY(-460px) scale(0.9) rotate(15deg);
                          opacity: 0;
                        }
                      }
                    `}</style>
                    {floatingEmojis.map((emoji) => (
                      <span
                        key={emoji.id}
                        className="absolute text-5xl inline-block drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                        style={{
                          left: `${emoji.left}%`,
                          bottom: '30px',
                          animation: 'floatUpEmoji 2.2s cubic-bezier(0.22, 0.61, 0.36, 1) forwards'
                        }}
                      >
                        {emoji.char}
                      </span>
                    ))}
                  </div>

                </div>

                {/* 2. Channel metadata details info */}
                <div className="p-4 bg-[#121824] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex gap-3">
                    {/* Streamer Avatar */}
                    <div className={`w-12 h-12 rounded-full ${activeChannel.avatarColor} border-2 border-slate-800 flex items-center justify-center font-extrabold text-slate-100 text-base shadow-lg shrink-0`}>
                      {activeChannel.avatarInitials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-slate-150 text-sm leading-tight hover:underline cursor-pointer">
                          {activeChannel.streamerName}
                        </h3>
                        {activeChannel.isVerified && (
                          <span className="text-[9px] bg-sky-950 font-bold text-[var(--ve-accent)] px-1.5 py-0.5 rounded-full border border-sky-900/40 flex items-center gap-0.5">
                            ⚡ STREAM PARTNER
                          </span>
                        )}
                        <span className="text-slate-480 text-xs">@{activeChannel.streamerUsername}</span>
                      </div>
                      
                      <p className="text-xs font-semibold text-slate-200 leading-relaxed mt-1 line-clamp-2">
                        {activeChannel.title}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-450 font-mono font-semibold flex-wrap">
                        <span className="text-slate-300 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded uppercase">{activeChannel.sport}</span>
                        <span className="text-slate-400 text-left">Targeting: {activeChannel.gameName}</span>
                        <span className="flex items-center gap-1 font-bold text-emerald-400">
                          ⭐ verified {activeChannel.winRate}% stats
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right segment: current viewers counter */}
                  <div className="flex items-center gap-3 leading-none shrink-0 self-start md:self-center">
                    <div className="bg-red-950/40 border border-red-900/50 px-3 py-2 rounded-xl text-center space-y-0.5 shadow">
                      <div className="flex items-center gap-1.5 text-rose-400 font-black text-xs font-mono justify-center">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping shrink-0" />
                        <span>{activeChannel.viewers.toLocaleString()}</span>
                      </div>
                      <p className="text-[9px] text-slate-550 font-bold uppercase tracking-wider font-mono">active viewers</p>
                    </div>
                  </div>
                </div>

                {/* 3. Interactive live vouch widget tray */}
                <div className="p-4.5 bg-[#0e131f] border-t border-slate-850 m-3.5 rounded-2xl border border-slate-850 space-y-3.5 relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 right-0 p-3 select-none pointer-events-none opacity-5">
                    <Zap className="w-32 h-32 text-amber-500 animate-pulse" />
                  </div>

                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] bg-amber-950/60 font-black text-amber-400 border border-amber-900/55 px-2 py-0.5 rounded-lg font-mono uppercase tracking-wider flex items-center gap-1 max-w-max">
                        <Zap className="w-3 h-3 fill-amber-400" /> streamer live vouch selection
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-150 mt-1">
                        {activeChannel.liveSlipSelection} — <span className="text-amber-400 font-mono">{activeChannel.liveSlipOdds} odds</span>
                      </h4>
                      <p className="text-[11px] text-slate-450">
                        {activeChannel.liveSlipMarket} | game: {activeChannel.liveSlipGame}
                      </p>
                    </div>

                    <button
                      onClick={() => handleQuickVouchOverlay(activeChannel)}
                      className="bg-gradient-to-r from-amber-550 to-orange-550 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black tracking-wide uppercase text-xs px-5 py-3 rounded-xl shadow-lg hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2 cursor-pointer border border-amber-300/20 shadow-md"
                      id="save-live-streamer-slip-btn"
                    >
                      <Zap className="w-4 h-4 fill-slate-950 text-slate-950 animate-bounce" />
                      vouch & tail live
                    </button>
                  </div>

                  <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-900 text-[10px] text-slate-500 flex items-center gap-2 text-left">
                    <span className="text-emerald-500 font-bold">✓ VouchEdge Certified</span>
                    <span>•</span>
                    <span>Tailing this stream auto-archives the ledger record in your local profile dashboard for 100% transparent history audits.</span>
                  </div>
                </div>

                {/* 4. Live Stream Interactive Channel Poll Widget */}
                <div className="mx-3.5 mb-3.5 p-4 bg-[#141b2b] rounded-2xl border border-slate-850 space-y-3">
                  <div className="flex justify-between items-center bg-slate-950/40 p-2 rounded-xl">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                      <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest font-mono select-none">Live Viewer Opinion Poll</h4>
                    </div>
                    {hasVoted ? (
                      <span className="text-[10px] text-emerald-450 font-bold uppercase font-mono bg-emerald-950/50 px-2.5 py-0.5 rounded border border-emerald-900/30">✓ Vote Recorded</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Status: Active</span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-300 text-left">
                    {activeChannel.pollQuestion}
                  </p>

                  <div className="space-y-2.5 pt-1">
                    {activeChannel.pollOptions.map((opt, i) => {
                      const totalVotes = pollVotes.reduce((acc, v) => acc + v, 0);
                      const percent = totalVotes > 0 ? Math.round((pollVotes[i] / totalVotes) * 100) : 50;

                      return (
                        <button
                          key={i}
                          onClick={() => handleVotePoll(i)}
                          disabled={hasVoted}
                          className="w-full relative overflow-hidden bg-[#0d121f] hover:bg-[#101726] p-3 rounded-xl border border-slate-800 text-left transition-all hover:border-slate-700 disabled:hover:bg-[#0d121f] disabled:hover:border-slate-800"
                        >
                          <div 
                            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 transition-all duration-500 rounded-l"
                            style={{ width: `${percent}%` }}
                          />
                          
                          <div className="flex justify-between items-center relative z-10 text-xs font-mono font-bold">
                            <span className="text-slate-300">{opt.label}</span>
                            <span className="text-sky-400 font-semibold">{percent}% <span className="text-slate-500 text-[10px]">({pollVotes[i]} votes)</span></span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Live Chat Room of Twitch stream */}
            <div className="lg:col-span-4" id="twitch-chatroom-feed-column">
              <div className="bg-[#121824] rounded-2xl border border-slate-850 h-[640px] flex flex-col justify-between overflow-hidden shadow-2xl relative" id="chat-theater-container">
                
                {/* Chat Title header */}
                <div className="bg-[#182030] border-b border-slate-850 px-4 py-3.5 flex items-center justify-between select-none shadow animate-fade-in">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="font-extrabold text-xs text-slate-100 uppercase tracking-widest font-mono">Live Stream Chat</span>
                  </div>

                  <div className="flex items-center gap-1 bg-red-950/40 px-2 py-0.5 rounded-full border border-red-900/30 animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-red-500" />
                    <span className="font-mono text-[9px] font-bold text-rose-455 uppercase leading-none">synchronized</span>
                  </div>
                </div>

                {/* Chat stream history ledger */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 h-[600px]" id="chat-messages-scroller-view">
                  {chats.map((c) => (
                    <div key={c.id} className="text-xs leading-relaxed text-left animate-slide-up" id={`chat-line-${c.id}`}>
                      <div className="flex flex-wrap gap-1.5 items-baseline">
                        
                        {c.role === 'mod' ? (
                          <span className="text-[8px] bg-red-950/60 text-red-400 border border-red-900/40 px-1 rounded-sm font-mono font-bold uppercase leading-none mr-0.5">MOD</span>
                        ) : c.role === 'broadcaster' ? (
                          <span className="text-[8px] bg-indigo-950/80 text-indigo-400 border border-indigo-900/40 px-1 rounded-sm font-mono font-bold uppercase tracking-wider leading-none mr-0.5">STREAMER</span>
                        ) : c.role === 'self' ? (
                          <span className="text-[8px] bg-emerald-950/70 text-emerald-455 border border-emerald-900/40 px-1 rounded-sm font-mono font-bold uppercase leading-none mr-0.5">YOU</span>
                        ) : null}

                        <span className={`font-black hover:underline cursor-pointer ${
                          c.role === 'broadcaster' 
                            ? 'text-indigo-400' 
                            : c.role === 'mod' 
                            ? 'text-red-400' 
                            : c.role === 'self' 
                            ? 'text-emerald-400' 
                            : 'text-slate-350'
                        }`}>
                          {c.user}
                        </span>
                        <span className="text-slate-500 font-mono">:</span>
                        
                        <span className={`text-[#e2e8f0] font-medium select-text break-words ${c.role === 'mod' ? 'italic text-indigo-300' : ''}`}>
                          {c.text}
                        </span>

                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Viewer Interaction Deck (Emoji reaction bar + Tip trigger button) */}
                <div className="px-3.5 py-2 bg-[#090d16] border-t border-slate-850/70 flex items-center justify-between gap-1.5 select-none relative z-10 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-slate-500 mr-1.5 font-mono uppercase tracking-wider">REACTION:</span>
                    {['🔥', '🚀', '👑', '🧠', '😭', '👏'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleTriggerReaction(emoji)}
                        className="text-sm p-1 hover:bg-slate-800/80 rounded transition-transform hover:scale-135 cursor-pointer transform duration-150"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTipModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/40 hover:border-yellow-500/70 text-yellow-500 text-[10.5px] font-black tracking-wider uppercase font-mono shadow-md transition-all scale-95"
                  >
                    <span>💰 Tip Streamer</span>
                  </button>
                </div>

                {/* Beautiful 15% Platform Split Tipping Dialog */}
                {showTipModal && (
                  <div className="absolute inset-0 bg-[#070a12]/95 backdrop-blur-sm z-30 p-5 flex flex-col justify-center text-left" id="tipping-calculation-deck">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-xs font-black text-yellow-505 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          ⚡ Transparent Tip Calculator
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowTipModal(false)}
                          className="text-[10px] font-mono text-slate-500 hover:text-slate-350 cursor-pointer border border-slate-800 px-2 py-0.5 rounded"
                        >
                          CLOSE [X]
                        </button>
                      </div>

                      <p className="text-[11px] font-semibold text-slate-300 leading-relaxed">
                        Tip your favorite streamer directly! Our platform retains a flat <span className="text-emerald-400 font-bold">15% commission</span> to cover transaction gas fees, and the remaining <span className="text-sky-400 font-bold">85% goes instantly to the capper</span>.
                      </p>

                      <div className="space-y-2">
                        <label className="text-[9.5px] font-bold text-slate-500 uppercase font-mono block">SELECT AMOUNT (USD)</label>
                        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                          {[5, 10, 20, 50].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setTipAmount(val)}
                              className={`py-1.5 rounded-lg text-xs font-black border transition-all ${
                                tipAmount === val
                                  ? 'bg-yellow-500/15 border-yellow-500 text-yellow-405'
                                  : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-205'
                              }`}
                            >
                              ${val}
                            </button>
                          ))}
                        </div>

                        {/* Interactive Fee Breakdown Display */}
                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 font-mono text-[11px] space-y-1.5">
                          <div className="flex justify-between text-slate-400 font-semibold">
                            <span>Tip Amount:</span>
                            <span className="text-slate-200">${tipAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-rose-500/90 font-semibold text-[10px]">
                            <span>Website Cut (15%):</span>
                            <span>-${(tipAmount * 0.15).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-450 font-black border-t border-slate-900 pt-1 text-xs">
                            <span>To Stream Creator (85%):</span>
                            <span>+${(tipAmount * 0.85).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDonate(tipAmount)}
                        className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-450 hover:to-amber-500 text-slate-950 font-black text-xs tracking-wider uppercase rounded-xl shadow-lg transition-transform active:scale-[0.98]"
                      >
                        Confirm and Send ${tipAmount} Tip ⚡
                      </button>
                    </div>
                  </div>
                )}

                {/* Chat Send Input Box area */}
                <div className="p-3 bg-[#0e1320] border-t border-slate-850">
                  <form onSubmit={sendUserChatMessage} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Send a chat message..."
                        value={userChatMsg}
                        onChange={(e) => setUserChatMsg(e.target.value)}
                        className="w-full text-xs bg-[#070a11] text-white border border-slate-800 rounded-xl px-3.5 pr-8 py-2.5 outline-none focus:border-[var(--ve-border-strong)] transition-all font-medium placeholder-slate-550 shadow-inner"
                        id="twitch-chat-input-val"
                        maxLength={150}
                      />
                      <Smile className="w-4 h-4 text-slate-500 absolute right-3 top-3 hover:text-slate-300 cursor-pointer" />
                    </div>
                    
                    <button
                      type="submit"
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-505 text-white rounded-xl transition-all font-extrabold uppercase flex items-center justify-center cursor-pointer shadow-md border border-indigo-500/10 hover:scale-105"
                      id="chat-send-submit-btn"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

              </div>
            </div>

          </div>
        )
      ) : (
        /* ================= GO-LIVE STREAMING STUDIO VIEW ================= */
        <div className="bg-[#121824] rounded-2xl border border-slate-850 overflow-hidden text-left" id="streaming-desk-outer">
          
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Stream monitor view and webcam output */}
            <div className="lg:col-span-8 p-6 space-y-5 border-r border-slate-850">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-rose-500 shrink-0" />
                  <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-widest font-mono">Stream Broadcast Monitor</h3>
                </div>

                {isUserLive ? (
                  <span className="bg-rose-950 font-black text-rose-400 border border-rose-900/60 text-[9px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> Broadcast Live
                  </span>
                ) : (
                  <span className="bg-slate-900 text-slate-500 border border-slate-800 text-[9px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    ● Offline sandbox
                  </span>
                )}
              </div>

              {/* Camera canvas / Dynamic interactive streaming mockup */}
              <div className="aspect-video w-full bg-slate-950 border border-slate-850 rounded-2xl relative flex flex-col justify-between p-6 overflow-hidden shadow-2xl" id="custom-live-webcam-panel">
                
                {/* Visual grid effects overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

                {/* Webcam Video element if active */}
                {webcamEnabled ? (
                  <div className="absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden rounded-2xl">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                    
                    {/* Visual overlay hud */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10 select-none">
                      <div className="bg-indigo-950/95 border border-indigo-800 px-3 py-1.5 rounded-xl font-mono text-[10px] text-indigo-305 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
                        <span>WEBCAM BROADCASTER ENCODING: H264_ACCEL</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Cyberpunk dynamic fallback layout when camera is disabled/missing
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#030611] via-[#091024] to-[#04081c] flex flex-col justify-between p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-slate-400 font-mono">
                        <VideoOff className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>CAMERA OFFLINE — STATIC COGNITIVE DECK</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-4 py-8">
                      <div className="w-16 h-16 bg-slate-900/60 rounded-full flex items-center justify-center border border-slate-800 shadow">
                        <Video className="w-6 h-6 text-slate-500 animate-pulse" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest">Awaiting Live Device Stream</p>
                        <p className="text-[10px] text-slate-500 font-mono max-w-sm mx-auto">
                          Activate your webcam to overlay your direct speaker face, or stick with our local pitch radar feeds.
                        </p>
                      </div>
                    </div>

                    <div className="h-6" />
                  </div>
                )}

                {/* Stream stats overlay inside video frame */}
                <div className="relative z-10 flex justify-between items-end mt-auto pt-20">
                  <div className="space-y-1.5 text-left bg-slate-950/80 p-3 rounded-xl border border-slate-850/60 max-w-md">
                    <span className="text-[8px] bg-rose-955 text-rose-400 border border-rose-900/50 px-2 py-0.5 rounded font-mono uppercase tracking-widest font-black">
                      active layout
                    </span>
                    <h4 className="text-xs font-bold text-slate-200 truncate leading-none mt-1">
                      {streamTitle || "Sports Analytics Stream"}
                    </h4>
                    <p className="text-[10px] text-slate-450 font-mono font-semibold">
                      🏈 Covering: {activeGameCover || "MLB Slate Highlights"}
                    </p>
                  </div>

                  {/* Sound meters */}
                  <div className="bg-slate-950/85 px-3 py-2 rounded-xl text-[9px] font-mono text-slate-400 border border-slate-850/60 text-right space-y-1 select-none">
                    <div className="flex items-center gap-2">
                      <Mic className={`w-3.5 h-3.5 ${micState ? 'text-emerald-400 animate-pulse' : 'text-rose-500'}`} />
                      <span>MIC STATE: {micState ? 'ON (GAINED)' : 'MUTED'}</span>
                    </div>
                    <div className="h-1 bg-slate-900 rounded overflow-hidden flex gap-0.5 items-center px-0.5">
                      <div className="bg-emerald-500 h-[2px] w-2 animate-pulse" />
                      <div className="bg-emerald-505 h-[2px] w-3 animate-pulse" />
                      <div className="bg-emerald-500 h-[2px] w-1 animate-pulse" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Streamer Desk Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Live Broadcast Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sweating MLB Late night sweep parlay!" 
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    disabled={isUserLive}
                    className="w-full text-xs bg-[#0b0f19] text-white border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-sky-500 font-semibold placeholder-slate-600 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Active Game Context</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Los Angeles Dodgers @ San Francisco Giants" 
                    value={activeGameCover}
                    onChange={(e) => setActiveGameCover(e.target.value)}
                    disabled={isUserLive}
                    className="w-full text-xs bg-[#0b0f19] text-white border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-[var(--ve-border-strong)] font-semibold placeholder-slate-600 disabled:opacity-50"
                  />
                </div>

                {/* Streamer configuration features */}
                <div className="flex gap-2.5 items-center md:col-span-2 pt-2 flex-wrap">
                  <button
                    onClick={handleToggleWebcam}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer border ${
                      webcamEnabled 
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-400' 
                        : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-705'
                    }`}
                  >
                    {webcamEnabled ? (
                      <>
                        <VideoOff className="w-4 h-4" />
                        Disable WebCam
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 text-emerald-400" />
                        Enable Webcam Device
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setMicState(!micState)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer border ${
                      micState 
                        ? 'bg-[#0b0f19] border-slate-850 text-slate-350 hover:border-slate-705' 
                        : 'bg-rose-955/30 border-rose-500/40 text-rose-450'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    {micState ? 'Mute Microphone' : 'Unmute Microphone'}
                  </button>

                  <button
                    onClick={() => setScreenShareSimulated(!screenShareSimulated)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer border ${
                      screenShareSimulated 
                        ? 'bg-emerald-950/25 border-emerald-500/35 text-emerald-400' 
                        : 'bg-[#0b0f19] border-slate-800 text-slate-400 hover:border-slate-705'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    {screenShareSimulated ? 'Stop Screen Projection' : 'Project VouchEdge Interface'}
                  </button>
                </div>

              </div>

              {/* Streaming state action banner */}
              <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-855 flex items-center justify-between flex-wrap gap-4">
                <div className="text-left">
                  <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono uppercase tracking-wider text-slate-400 font-bold">
                    ready state status
                  </span>
                  <p className="text-xs font-bold text-slate-300 mt-1">
                    Your audio, camera feeds, and analytics profiles are fully aligned.
                  </p>
                </div>

                {isUserLive ? (
                  <button
                    onClick={handleStopUserStream}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-xs tracking-wider px-6 py-3.5 rounded-xl shadow-lg hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer"
                  >
                    🔴 Stop Broadcast Feed
                  </button>
                ) : (
                  <button
                    onClick={handleStartUserStream}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-wider px-6 py-3.5 rounded-xl shadow-lg hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer"
                  >
                    ⚡ Start Broadcasting Now
                  </button>
                )}
              </div>

            </div>

            {/* Go-Live Desk Live chat monitor and telemetry statistics */}
            <div className="lg:col-span-4 p-6 space-y-5">
              
              <div className="bg-[#182030] rounded-2xl border border-slate-850 p-4 space-y-4">
                <h4 className="font-extrabold text-xs text-slate-150 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#ff9f43]" />
                  Live Broadcast Telemetry
                </h4>
                
                <div className="grid grid-cols-2 gap-3.5 font-mono text-center">
                  <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-850/60">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Duration</span>
                    <p className="text-sm font-black text-slate-200 mt-1">{isUserLive ? formatSecs(streamDuration) : "00:00:00"}</p>
                  </div>

                  <div className="bg-[#0b0f19] p-3 rounded-xl border border-[#1e293b]/60">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Watching</span>
                    <p className="text-sm font-black text-rose-400 mt-1">{isUserLive ? userStreamViewers : 0}</p>
                  </div>

                  <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-850/60 col-span-2">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Peak Bitrate</span>
                    <p className="text-xs font-black text-emerald-400 mt-1">{isUserLive ? "4500 Kbps (Stable)" : "0 Kbps"}</p>
                  </div>
                </div>
              </div>

              {/* Streaming Chat Monitor */}
              <div className="bg-[#121824] rounded-2xl border border-slate-850 h-[380px] flex flex-col justify-between overflow-hidden shadow">
                
                <div className="bg-slate-900/80 border-b border-slate-850 px-4 py-3 flex items-center justify-between">
                  <span className="font-extrabold text-[10px] text-slate-300 uppercase tracking-widest font-mono">Stream Chat Feed</span>
                  <span className="text-[8px] bg-red-950/60 text-red-400 border border-red-900 /40 px-1.5 py-0.2 rounded font-mono uppercase tracking-widest">
                    monitor
                  </span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono h-[280px]">
                  {isUserLive ? (
                    chats.map((c) => (
                      <div key={c.id} className="text-[11px] select-text animate-slide-up text-left" id={`moni-chat-${c.id}`}>
                        <span className={`font-bold hover:underline cursor-pointer ${
                          c.role === 'self' ? 'text-emerald-400' : 'text-slate-350'
                        }`}>
                          @{c.user}
                        </span>
                        <span className="text-slate-500">:</span> <span className="text-slate-300 font-medium">{c.text}</span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 space-y-1 p-4">
                      <MessageSquare className="w-8 h-8 text-slate-700 animate-pulse" />
                      <p className="text-[10px] uppercase font-bold font-mono">Chat Room Offline</p>
                      <p className="text-[9px] text-slate-650 font-mono">Your stream chat will activate once you go live.</p>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                <div className="p-2.5 bg-[#0e1320] border-t border-slate-850">
                  <form onSubmit={sendUserChatMessage} className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      placeholder={isUserLive ? "Reply to chat fans..." : "Broadcaster muted"}
                      value={userChatMsg}
                      onChange={(e) => setUserChatMsg(e.target.value)}
                      disabled={!isUserLive}
                      className="flex-1 text-xs bg-[#070a11] text-white border border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-[var(--ve-border-strong)] font-medium placeholder-slate-600 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!isUserLive}
                      className="p-2 bg-indigo-600 hover:bg-indigo-505 text-white rounded-lg transition-all font-bold uppercase cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
