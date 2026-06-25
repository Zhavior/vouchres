import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  UserCheck, 
  UserPlus, 
  ArrowUpRight, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  Zap, 
  CheckCircle, 
  SlidersHorizontal,
  Flame,
  Info,
  ShieldAlert,
  Search
} from 'lucide-react';

interface LeaderboardProps {
  profile: any;
  onSectionChange: (section: string) => void;
}

interface Capper {
  rank: number;
  displayName: string;
  username: string;
  avatarColor: string;
  avatarInitials: string;
  winRecord: string; // e.g. "45-18"
  winRate: number; // e.g. 71.4
  peakProfit: number; // units, e.g. 54.2
  streak: string; // e.g. "5 W Streak"
  badge: { name: string; color: string; bg: string };
  primarySport: string;
  followersCount: number;
  isVerified: boolean;
  avatarUrl?: string;
}

const TOP_10_CAPPERS: Capper[] = [
  {
    rank: 1,
    displayName: "Sharp Betting Guru",
    username: "sharp_guru_pro",
    avatarColor: "bg-indigo-600",
    avatarInitials: "SG",
    winRecord: "42-15",
    winRate: 73.7,
    peakProfit: 58.4,
    streak: "🔥 6 W Streak",
    badge: { name: "Sharp Oracle", color: "text-amber-400 border-amber-500/30", bg: "bg-amber-950/40" },
    primarySport: "MLB",
    followersCount: 14205,
    isVerified: true
  },
  {
    rank: 2,
    displayName: "Sabermetrics Pro",
    username: "sabermetrics_pro",
    avatarColor: "bg-teal-600",
    avatarInitials: "SP",
    winRecord: "38-16",
    winRate: 70.3,
    peakProfit: 46.8,
    streak: "📈 4 W Sweep",
    badge: { name: "AI Analyst", color: "text-teal-400 border-teal-500/30", bg: "bg-teal-950/40" },
    primarySport: "MLB Props",
    followersCount: 9350,
    isVerified: true
  },
  {
    rank: 3,
    displayName: "Parlay Princess",
    username: "parlay_queen_locks",
    avatarColor: "bg-pink-600",
    avatarInitials: "PQ",
    winRecord: "35-15",
    winRate: 70.0,
    peakProfit: 41.2,
    streak: "✨ 3 W Streak",
    badge: { name: "HR Prophet", color: "text-pink-400 border-pink-500/30", bg: "bg-pink-950/40" },
    primarySport: "MLB Homers",
    followersCount: 8200,
    isVerified: true
  },
  {
    rank: 4,
    displayName: "Edge Sizer",
    username: "edge_sizer_caps",
    avatarColor: "bg-violet-600",
    avatarInitials: "ES",
    winRecord: "30-14",
    winRate: 68.1,
    peakProfit: 34.5,
    streak: "🔥 5 W Streak",
    badge: { name: "Calculated Peak", color: "text-violet-400 border-violet-500/20", bg: "bg-violet-955/20" },
    primarySport: "MLB Totals",
    followersCount: 4210,
    isVerified: false
  },
  {
    rank: 5,
    displayName: "Wrigley Wind Specialist",
    username: "wrigley_wind_tracker",
    avatarColor: "bg-orange-600",
    avatarInitials: "WW",
    winRecord: "28-13",
    winRate: 68.2,
    peakProfit: 32.1,
    streak: "🌿 2 W Streak",
    badge: { name: "Meteorological Edge", color: "text-orange-400 border-orange-500/20", bg: "bg-orange-955/20" },
    primarySport: "MLB Under",
    followersCount: 5120,
    isVerified: false
  },
  {
    rank: 6,
    displayName: "Boston Bullpen Scout",
    username: "boston_scout_66",
    avatarColor: "bg-rose-600",
    avatarInitials: "BS",
    winRecord: "29-14",
    winRate: 67.4,
    peakProfit: 29.8,
    streak: "❄️ 1 L State",
    badge: { name: "Bullpen Radar", color: "text-rose-455 border-rose-500/20", bg: "bg-rose-955/20" },
    primarySport: "MLB Relievers",
    followersCount: 2310,
    isVerified: true
  },
  {
    rank: 7,
    displayName: "Underdog Sorter",
    username: "underdog_oracle",
    avatarColor: "bg-amber-600",
    avatarInitials: "UO",
    winRecord: "25-13",
    winRate: 65.7,
    peakProfit: 28.5,
    streak: "🔥 4 W Streak",
    badge: { name: "Value Seeker", color: "text-amber-400 border-amber-500/20", bg: "bg-amber-955/20" },
    primarySport: "MLB Moneylines",
    followersCount: 6180,
    isVerified: false
  },
  {
    rank: 8,
    displayName: "K-Prop Commander",
    username: "k_prop_commander",
    avatarColor: "bg-sky-600",
    avatarInitials: "KC",
    winRecord: "26-15",
    winRate: 63.4,
    peakProfit: 22.4,
    streak: "🔥 2 W Streak",
    badge: { name: "Strikeout Alpha", color: "text-sky-400 border-sky-500/20", bg: "bg-sky-955/20" },
    primarySport: "MLB Pitching Props",
    followersCount: 3950,
    isVerified: true
  },
  {
    rank: 9,
    displayName: "Golden Ticket Sweep",
    username: "gold_ticket_sweeps",
    avatarColor: "bg-cyan-600",
    avatarInitials: "GT",
    winRecord: "22-13",
    winRate: 62.8,
    peakProfit: 19.5,
    streak: "🌿 Flat Line",
    badge: { name: "Parlay Sweeper", color: "text-cyan-405 border-cyan-500/20", bg: "bg-cyan-955/20" },
    primarySport: "MLB Alternative Lines",
    followersCount: 1840,
    isVerified: false
  },
  {
    rank: 10,
    displayName: "Runline Raider",
    username: "runline_raiders",
    avatarColor: "bg-emerald-600",
    avatarInitials: "RR",
    winRecord: "20-12",
    winRate: 62.5,
    peakProfit: 18.2,
    streak: "🔥 3 W Streak",
    badge: { name: "Spread Tactician", color: "text-emerald-400 border-emerald-500/20", bg: "bg-emerald-955/20" },
    primarySport: "MLB Handcaps",
    followersCount: 2250,
    isVerified: false
  }
];

export default function Leaderboard({ profile, onSectionChange }: LeaderboardProps) {
  const [activeRange, setActiveRange] = useState<'month' | 'week' | 'all-time'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [followedStates, setFollowedStates] = useState<Record<string, boolean>>({});
  const [selectedCapper, setSelectedCapper] = useState<Capper | null>(null);

  const toggleFollow = (username: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening detailed modal
    setFollowedStates(p => ({
      ...p,
      [username]: !p[username]
    }));
  };

  const getFilteredCappers = () => {
    let list = [...TOP_10_CAPPERS];
    
    // Simulating slight adjustments for weekly / all-time to make UI organic
    if (activeRange === 'week') {
      list = list.map(c => ({
        ...c,
        winRecord: `${Math.round(c.rank * 1.5)}-${Math.max(1, Math.round(c.rank / 2))}`,
        winRate: Number((100 - (c.rank * 2.8)).toFixed(1)),
        peakProfit: Number((30 - (c.rank * 2)).toFixed(1)),
      })).sort((a,b) => b.winRate - a.winRate);
      
      // Re-assign rank indices after weekly sorting
      list = list.map((c, idx) => ({ ...c, rank: idx + 1 }));
    } else if (activeRange === 'all-time') {
      list = list.map(c => ({
        ...c,
        winRecord: `${Math.round(c.rank * 15)}-${Math.round(c.rank * 6)}`,
        winRate: Number((80 - (c.rank * 1.4)).toFixed(1)),
        peakProfit: Number((240 - (c.rank * 15)).toFixed(1)),
      })).sort((a,b) => b.peakProfit - a.peakProfit);
      
      list = list.map((c, idx) => ({ ...c, rank: idx + 1 }));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => 
        c.displayName.toLowerCase().includes(q) || 
        c.username.toLowerCase().includes(q) ||
        c.primarySport.toLowerCase().includes(q)
      );
    }
    
    return list;
  };

  const cappersList = getFilteredCappers();
  
  // Extract top 3 podium if present
  const firstPlace = cappersList.find(c => c.rank === 1);
  const secondPlace = cappersList.find(c => c.rank === 2);
  const thirdPlace = cappersList.find(c => c.rank === 3);

  // The remaining cappers
  const top10List = cappersList; // We show full 10 list or those matching filters

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto min-h-screen bg-transparent space-y-6 text-left" id="leaderboard-outer-wrapper">
      
      {/* Demo banner */}
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-[11px] text-amber-300/80">
        <span className="text-[9px] font-black font-mono uppercase px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/15 text-amber-300">Demo</span>
        Capper rankings are sample data — real leaderboard populates as users post verified picks.
      </div>

      {/* Upper header segment and description */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-850 pb-5" id="leaderboard-header">
        <div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400 animate-bounce shrink-0" />
            Top Verifiable Cappers & Edge Board
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse transparent records, historical unit yield, and winning percentages audited directly by the chain ledger.
          </p>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-850 self-start text-xs font-semibold" id="leaderboard-filters">
          <button
            onClick={() => setActiveRange('month')}
            className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wide transition-all ${
              activeRange === 'month'
                ? 'bg-gradient-to-tr from-amber-600 to-indigo-650 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            This Month
          </button>
          
          <button
            onClick={() => setActiveRange('week')}
            className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wide transition-all ${
              activeRange === 'week'
                ? 'bg-gradient-to-tr from-amber-600 to-indigo-650 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Weekly Sweep
          </button>

          <button
            onClick={() => setActiveRange('all-time')}
            className={`px-3 py-1.5 rounded-lg font-black uppercase tracking-wide transition-all ${
              activeRange === 'all-time'
                ? 'bg-gradient-to-tr from-amber-600 to-indigo-650 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All-Time Legends
          </button>
        </div>
      </div>

      {/* SEARCH AND INFORMATION BADGE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 relative">
          <input
            type="text"
            placeholder="Search verified cappers, sports, or system badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-[#121824] text-slate-100 border border-slate-850 pl-9 pr-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-all placeholder-slate-500 font-semibold"
          />
          <Search className="w-4 h-4 text-slate-550 absolute left-3 top-3.5" />
        </div>

        <div className="md:col-span-4 bg-slate-900/40 border border-slate-850 p-2.5 rounded-xl text-[10px] text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Records are automatically locked once parlay game scores settle. No deleted history or manual edits.</span>
        </div>
      </div>

      {/* ================= DESIGN ELEMENT: STUNNING PODIUM DISPLAY FOR TOP 3 ================= */}
      {cappersList.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 block" id="podium-display-wrapper">
          
          {/* SILVER - SECOND PLACE COLUMN */}
          {secondPlace && (
            <div 
              onClick={() => setSelectedCapper(secondPlace)}
              className="bg-gradient-to-b from-[#161d2d] to-[#121824] rounded-2xl border border-slate-800 p-5 pt-7 text-center relative flex flex-col justify-between items-center group cursor-pointer hover:border-slate-500/50 hover:shadow-xl transition-all h-[360px] order-2 md:order-1"
            >
              {/* Silver circular placement crown */}
              <div className="absolute top-0 transform -translate-y-1/2 bg-slate-400 text-slate-950 font-black text-xs font-mono px-3 py-1 rounded-full shadow-lg border border-white/20 uppercase tracking-widest flex items-center gap-1">
                🥈 Run Rank 2
              </div>

              <div className="space-y-4 w-full">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full ${secondPlace.avatarColor} mx-auto border-4 border-slate-400 flex items-center justify-center text-slate-150 font-extrabold text-xl shadow-lg`}>
                    {secondPlace.avatarInitials}
                  </div>
                  {secondPlace.isVerified && (
                    <span className="absolute bottom-0 right-1/3 bg-slate-900 text-sky-400 p-0.5 rounded-full border border-sky-905">
                      <CheckCircle className="w-3.5 h-3.5 fill-sky-955" />
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-150 text-sm group-hover:underline">{secondPlace.displayName}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">@{secondPlace.username}</p>
                </div>

                <div className={`px-2.5 py-0.5 border ${secondPlace.badge.color} ${secondPlace.badge.bg} rounded-md text-[9px] font-mono font-black uppercase inline-block`}>
                  {secondPlace.badge.name}
                </div>
              </div>

              {/* Core Audited Stats Block */}
              <div className="grid grid-cols-2 gap-2 bg-[#0b0f19]/70 w-full p-3 rounded-xl border border-slate-850/80 mt-4 h-[100px] items-center">
                <div className="text-left">
                  <span className="text-[8px] uppercase text-slate-500 font-mono font-bold font-semibold block">win rate %</span>
                  <p className="text-sm font-black text-teal-400 font-mono mt-0.5">{secondPlace.winRate}%</p>
                  <span className="text-[9px] text-slate-400 font-semibold font-mono">{secondPlace.winRecord}</span>
                </div>
                <div className="text-right border-l border-slate-850/60 pl-2">
                  <span className="text-[8px] uppercase text-slate-500 font-mono font-bold block">Profit Month</span>
                  <p className="text-sm font-black text-emerald-455 font-mono mt-0.5">+{secondPlace.peakProfit} U</p>
                  <span className="text-[9px] text-slate-400 font-semibold font-mono uppercase">{secondPlace.primarySport}</span>
                </div>
              </div>

              <div className="text-[10px] text-indigo-400 font-mono font-bold mt-2.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
                <span>{secondPlace.streak}</span>
              </div>
            </div>
          )}

          {/* GOLD - FIRST PLACE COLUMN */}
          {firstPlace && (
            <div 
              onClick={() => setSelectedCapper(firstPlace)}
              className="bg-gradient-to-b from-[#1e2335] via-[#121824] to-[#121824] rounded-2xl border-2 border-amber-500/40 p-5 pt-8 text-center relative flex flex-col justify-between items-center group cursor-pointer hover:border-amber-400 hover:shadow-2xl hover:scale-[1.03] transition-all h-[380px] order-1 md:order-2 shadow-amber-500/5"
            >
              {/* Sparkling Crown badge */}
              <div className="absolute top-0 transform -translate-y-1/2 bg-amber-500 text-slate-950 font-black text-xs font-mono px-4 py-1.5 rounded-full shadow-xl border border-amber-300 animate-pulse uppercase tracking-widest flex items-center gap-1 z-10">
                🥇 Champion Rank 1
              </div>

              <div className="space-y-4 w-full">
                <div className="relative">
                  <div className={`w-20 h-20 rounded-full ${firstPlace.avatarColor} mx-auto border-4 border-amber-500 flex items-center justify-center text-slate-100 font-extrabold text-2xl shadow-xl relative`}>
                    {firstPlace.avatarInitials}
                    <Sparkles className="w-5 h-5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  {firstPlace.isVerified && (
                    <span className="absolute bottom-0 right-1/3 bg-slate-900 text-sky-400 p-0.5 rounded-full border border-sky-905 shadow-md">
                      <CheckCircle className="w-4 h-4 fill-sky-955" />
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-100 text-base group-hover:underline tracking-wide">{firstPlace.displayName}</h3>
                  <p className="text-xs text-slate-500 font-semibold">@{firstPlace.username}</p>
                </div>

                <div className={`px-3 py-1 border ${firstPlace.badge.color} ${firstPlace.badge.bg} rounded-md text-[10px] font-mono font-black uppercase tracking-wider inline-block`}>
                  ⭐ {firstPlace.badge.name}
                </div>
              </div>

              {/* Core Audited Stats Block */}
              <div className="grid grid-cols-2 gap-2 bg-[#090d16]/90 w-full p-3.5 rounded-xl border border-amber-500/20 mt-4 h-[100px] items-center shadow-inner">
                <div className="text-left">
                  <span className="text-[8px] uppercase text-slate-500 font-mono font-bold block">win rate %</span>
                  <p className="text-base font-black text-teal-400 font-mono tracking-tight mt-0.5">{firstPlace.winRate}%</p>
                  <span className="text-[9px] text-slate-350 font-bold font-mono">{firstPlace.winRecord}</span>
                </div>
                <div className="text-right border-l border-slate-800 pl-2">
                  <span className="text-[8px] uppercase text-slate-500 font-mono font-bold block">Profit Month</span>
                  <p className="text-base font-black text-amber-400 font-mono tracking-tight mt-0.5">+{firstPlace.peakProfit} U</p>
                  <span className="text-[9px] text-slate-350 font-bold font-mono uppercase">{firstPlace.primarySport}</span>
                </div>
              </div>

              <div className="text-xs text-amber-400 font-mono font-semibold mt-3 flex items-center gap-1 tracking-wide animate-pulse">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                <span>{firstPlace.streak}</span>
              </div>
            </div>
          )}

          {/* BRONZE - THIRD PLACE COLUMN */}
          {thirdPlace && (
            <div 
              onClick={() => setSelectedCapper(thirdPlace)}
              className="bg-gradient-to-b from-[#141b29] to-[#121824] rounded-2xl border border-slate-800 p-5 pt-7 text-center relative flex flex-col justify-between items-center group cursor-pointer hover:border-slate-500/50 hover:shadow-xl transition-all h-[360px] order-3 md:order-3"
            >
              <div className="absolute top-0 transform -translate-y-1/2 bg-amber-800 text-slate-100 font-black text-xs font-mono px-3 py-1 rounded-full shadow-lg border border-white/10 uppercase tracking-widest flex items-center gap-1">
                🥉 Run Rank 3
              </div>

              <div className="space-y-4 w-full">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full ${thirdPlace.avatarColor} mx-auto border-4 border-amber-805 flex items-center justify-center text-slate-150 font-extrabold text-xl shadow-lg`}>
                    {thirdPlace.avatarInitials}
                  </div>
                  {thirdPlace.isVerified && (
                    <span className="absolute bottom-0 right-1/3 bg-slate-900 text-sky-400 p-0.5 rounded-full border border-sky-905">
                      <CheckCircle className="w-3.5 h-3.5 fill-sky-955" />
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-150 text-sm group-hover:underline">{thirdPlace.displayName}</h3>
                  <p className="text-[11px] text-slate-505 font-medium">@{thirdPlace.username}</p>
                </div>

                <div className={`px-2.5 py-0.5 border ${thirdPlace.badge.color} ${thirdPlace.badge.bg} rounded-md text-[9px] font-mono font-black uppercase inline-block`}>
                  {thirdPlace.badge.name}
                </div>
              </div>

              {/* Core Audited Stats Block */}
              <div className="grid grid-cols-2 gap-2 bg-[#0b0f19]/70 w-full p-3 rounded-xl border border-slate-850/80 mt-4 h-[100px] items-center">
                <div className="text-left">
                  <span className="text-[8px] uppercase text-slate-505 font-mono font-bold block">win rate %</span>
                  <p className="text-sm font-black text-teal-400 font-mono mt-0.5">{thirdPlace.winRate}%</p>
                  <span className="text-[9px] text-slate-400 font-semibold font-mono">{thirdPlace.winRecord}</span>
                </div>
                <div className="text-right border-l border-slate-800 pl-2">
                  <span className="text-[8px] uppercase text-slate-505 font-mono font-bold block">Profit Month</span>
                  <p className="text-sm font-black text-emerald-450 font-mono mt-0.5">+{thirdPlace.peakProfit} U</p>
                  <span className="text-[9px] text-slate-400 font-semibold font-mono uppercase">{thirdPlace.primarySport}</span>
                </div>
              </div>

              <div className="text-[10px] text-indigo-400 font-mono font-bold mt-2.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
                <span>{thirdPlace.streak}</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= TABLE LISTING: ALL TOP CAPPERS SECTION ================= */}
      <div className="bg-[#121824] rounded-2xl border border-slate-850 overflow-hidden shadow-2xl space-y-3" id="all-cappers-ranking-table">
        <div className="bg-slate-900/60 p-4 border-b border-slate-850 flex items-center justify-between select-none font-semibold">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider font-mono">
              Audited Cappers Leaderboard Ranking ({cappersList.length})
            </h3>
          </div>
          
          <span className="text-[10px] font-mono text-emerald-400 animate-pulse bg-emerald-950/60 border border-emerald-900 px-3 py-1 rounded">
            ● LEDGER SYNCED
          </span>
        </div>

        {cappersList.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <ShieldAlert className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
            <p className="text-xs uppercase font-bold font-mono text-slate-400">No matching certified records</p>
            <p className="text-[11px] text-slate-500">Refine your search parameters to evaluate other cappers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-left whitespace-nowrap">
            <table className="w-full text-xs font-medium text-slate-350 min-w-[700px]">
              
              <thead className="bg-[#0b0f19]/80 border-b border-slate-850 text-slate-450 font-black uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-5 py-3.5 text-center w-[80px]">Rank</th>
                  <th className="px-5 py-3.5 text-left">Verified Capper</th>
                  <th className="px-5 py-3.5 text-center">Score Record</th>
                  <th className="px-5 py-3.5 text-center">Win Hit Rate</th>
                  <th className="px-5 py-3.5 text-center">Profit Yield</th>
                  <th className="px-5 py-3.5 text-center">Active Streak</th>
                  <th className="px-5 py-3.5 text-center">Primary Slot</th>
                  <th className="px-5 py-3.5 text-center w-[120px]">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-850/60">
                {top10List.map((capper) => {
                  const isFollowed = followedStates[capper.username];
                  
                  return (
                    <tr 
                      key={capper.username}
                      onClick={() => setSelectedCapper(capper)}
                      className="hover:bg-slate-900/40 transition-colors cursor-pointer group"
                    >
                      {/* Rank Column */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center font-black">
                          {capper.rank === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold font-mono shadow border border-amber-400 text-xs">1</span>
                          ) : capper.rank === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-400 text-slate-950 flex items-center justify-center font-bold font-mono shadow border border-slate-300 text-xs text-xs">2</span>
                          ) : capper.rank === 3 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-805 text-slate-100 flex items-center justify-center font-bold font-mono shadow border border-amber-700 text-xs">3</span>
                          ) : (
                            <span className="text-slate-400 font-mono font-bold">{capper.rank}</span>
                          )}
                        </div>
                      </td>

                      {/* User Info Column */}
                      <td className="px-5 py-4">
                        <div className="flex gap-2.5 items-center">
                          <div className={`w-8 h-8 rounded-full ${capper.avatarColor} font-bold text-slate-200 text-xs flex items-center justify-center shrink-0`}>
                            {capper.avatarInitials}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-extrabold text-slate-200 group-hover:text-indigo-400 transition-colors">{capper.displayName}</span>
                              {capper.isVerified && <CheckCircle className="w-3.5 h-3.5 text-sky-400 fill-sky-955" />}
                            </div>
                            <span className="text-[10px] text-slate-500 block">@{capper.username} • {capper.followersCount.toLocaleString()} followers</span>
                          </div>
                        </div>
                      </td>

                      {/* Win-Loss Record */}
                      <td className="px-5 py-4 text-center">
                        <span className="font-bold text-slate-300 font-mono bg-[#0b0f19] px-2.5 py-1 rounded border border-slate-850">
                          {capper.winRecord}
                        </span>
                      </td>

                      {/* Win Rate Percentage */}
                      <td className="px-5 py-4 text-center">
                        <span className="text-emerald-400 font-black font-mono">
                          {capper.winRate}%
                        </span>
                      </td>

                      {/* Net profit in unit yield */}
                      <td className="px-5 py-4 text-center">
                        <span className="text-amber-400 font-black font-mono bg-amber-955/20 px-2.5-py-1 rounded border border-amber-950/20">
                          +{capper.peakProfit} Units
                        </span>
                      </td>

                      {/* Streak badge */}
                      <td className="px-5 py-4 text-center">
                        <span className="text-[10px] text-indigo-400 font-semibold font-mono flex items-center justify-center gap-1 uppercase leading-none">
                          <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 shrink-0" />
                          {capper.streak}
                        </span>
                      </td>

                      {/* Primary target sport */}
                      <td className="px-5 py-4 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono px-2 py-0.5 bg-slate-950 rounded">
                          {capper.primarySport}
                        </span>
                      </td>

                      {/* Action trigger button */}
                      <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => toggleFollow(capper.username, e)}
                          className={`w-full text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                            isFollowed 
                              ? 'bg-slate-900 border-indigo-505/30 text-indigo-400 hover:bg-slate-850' 
                              : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500/20 text-white'
                          }`}
                        >
                          {isFollowed ? (
                            <>
                              <UserCheck className="w-3 h-3 text-indigo-400" />
                              <span>Following</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL PROFILE DETAILS OVERVIEW POPUP ================= */}
      {selectedCapper && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          
          <div className="bg-[#121824] rounded-2xl border border-slate-800 w-full max-w-lg overflow-hidden shadow-2xl relative">
            
            {/* Upper profile header block */}
            <div className="bg-[#1a2135] p-6 border-b border-slate-850 flex items-start justify-between">
              
              <div className="flex gap-4">
                <div className={`w-14 h-14 rounded-full ${selectedCapper.avatarColor} border-2 border-slate-705 flex items-center justify-center font-extrabold text-slate-100 text-xl shadow-lg`}>
                  {selectedCapper.avatarInitials}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-extrabold text-[#e2e8f0] text-base leading-none">
                      {selectedCapper.displayName}
                    </h3>
                    {selectedCapper.isVerified && <CheckCircle className="w-4 h-4 text-sky-400 fill-sky-955" />}
                  </div>
                  <p className="text-xs text-slate-450 mt-1">@{selectedCapper.username} | {selectedCapper.followersCount.toLocaleString()} Subscribers</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono font-bold uppercase py-0.5 px-2 bg-indigo-950 text-indigo-400 rounded-md border border-indigo-900/30">
                      {selectedCapper.primarySport}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase py-0.5 px-2 bg-[#0b0f19] border border-slate-805 text-slate-450 rounded-md">
                      {selectedCapper.badge.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close button icon */}
              <button 
                onClick={() => setSelectedCapper(null)}
                className="text-slate-500 hover:text-slate-205 transition-colors p-1 bg-slate-900/40 hover:bg-slate-900 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Audit metrics details breakdown */}
            <div className="p-6 space-y-4">
              
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest font-mono">
                verified capper performance card
              </h4>

              <div className="grid grid-cols-3 gap-3 font-mono text-center">
                
                <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] uppercase font-extrabold">record</span>
                  <p className="text-xs font-black text-slate-205 mt-1">{selectedCapper.winRecord}</p>
                </div>

                <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] uppercase font-extrabold">win rate</span>
                  <p className="text-xs font-black text-teal-400 mt-1">{selectedCapper.winRate}%</p>
                </div>

                <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-[10px] uppercase font-extrabold">yield profit</span>
                  <p className="text-xs font-black text-amber-400 mt-1">+{selectedCapper.peakProfit} U</p>
                </div>

              </div>

              {/* Advanced consistency score metrics */}
              <div className="p-4 bg-slate-950/45 rounded-xl border border-slate-900 text-xs text-slate-400 space-y-3">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-450 font-mono">
                  <span>Audited consistency values</span>
                  <span className="text-emerald-450 font-semibold">95.4% reliability rank</span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-900/40 p-1 px-2 rounded font-mono">
                  <span>Average Odds Tailed</span>
                  <span className="font-bold text-slate-202">-115 to +145 range</span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/40 p-1 px-2 rounded font-mono">
                  <span>Consistently Audited Wins</span>
                  <span className="font-bold text-slate-202">45 verified matches</span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/40 p-1 px-2 rounded font-mono">
                  <span>Peak Streak Yield</span>
                  <span className="font-bold text-rose-455">10 consecutive sweeps</span>
                </div>
              </div>

              {/* Action trigger slots */}
              <div className="flex gap-2.5 items-center w-full pt-2">
                <button
                  onClick={(e) => {
                    toggleFollow(selectedCapper.username, e);
                  }}
                  className={`flex-1 font-black uppercase text-xs tracking-wider py-3.5 rounded-xl shadow transition-all cursor-pointer border text-center ${
                    followedStates[selectedCapper.username] 
                      ? 'bg-slate-900 border-slate-800 text-slate-400' 
                      : 'bg-indigo-650 text-white border-indigo-505/20 hover:bg-indigo-500'
                  }`}
                >
                  {followedStates[selectedCapper.username] ? '✓ Following Account' : '✦ Follow Capper'}
                </button>

                <button
                  onClick={() => {
                    setSelectedCapper(null);
                    onSectionChange('feed');
                  }}
                  className="bg-slate-950 hover:bg-slate-900 text-slate-100 font-bold uppercase text-xs tracking-wider py-3.5 px-4 rounded-xl border border-slate-805 text-center cursor-pointer"
                >
                  View Feed Posts
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
