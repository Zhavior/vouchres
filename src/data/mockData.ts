import { FeedPost, CreatorProofProfile, GameMarket } from '../types';

export const INITIAL_PROFILE: CreatorProofProfile = {
  displayName: "ProEdge Bettor",
  username: "proedge_tracker",
  avatarUrl: "", // Use custom SVG initials
  bio: "Transparent sports modeller. Specializing in pitch matching and MLB player props. 100% verified track record.",
  verified: true,
  winRate: 58.3,
  totalPicks: 120,
  wonPicks: 70,
  unitsTracked: 155,
  unitsNetProfit: 24.5,
  subscriptionTier: 'BASIC'
};

export const HOT_MARKETS: GameMarket[] = [
  {
    id: "g1",
    game: "Los Angeles Dodgers @ San Francisco Giants",
    sport: "MLB",
    startTime: "Today, 7:15 PM",
    headlineMarket: "Dodgers Run Line (-1.5)",
    selections: [
      { name: "Dodgers -1.5", odds: "+110", vouchCount: 42 },
      { name: "Giants +1.5", odds: "-130", vouchCount: 15 }
    ]
  },
  {
    id: "g2",
    game: "New York Yankees @ Boston Red Sox",
    sport: "MLB",
    startTime: "Today, 6:05 PM",
    headlineMarket: "Total Runs Over/Under 8.5",
    selections: [
      { name: "Over 8.5", odds: "-115", vouchCount: 29 },
      { name: "Under 8.5", odds: "-105", vouchCount: 11 }
    ]
  },
  {
    id: "g3",
    game: "Atlanta Braves @ New York Mets",
    sport: "MLB",
    startTime: "Tomorrow, 4:10 PM",
    headlineMarket: "Braves Moneyline",
    selections: [
      { name: "Braves ML", odds: "-145", vouchCount: 33 },
      { name: "Mets ML", odds: "+125", vouchCount: 19 }
    ]
  }
];

export const INITIAL_POSTS: FeedPost[] = [
  {
    id: "post-1",
    userId: "ve-alg-1",
    displayName: "VouchEdge AI Model",
    username: "ve_model_mlb",
    isVerified: true,
    timestamp: "2026-06-19T10:30:00-07:00",
    sportBadge: "MLB",
    sourceBadge: "AI Pick",
    postType: "AI_PICK",
    profileThemeId: "cyber-blue",
    profileBorderId: "cyber_glow_pulse",
    content: "Our predictive model highlights high-value correlation in tonight's Padres vs Dodgers game. Tyler Glasnow's strikeout rate at home (32.4%) matches well with the Padres high-chase rate on sweepers (34%). Avoid taking high-unit lines, but the value is on the home side.",
    researchNote: {
      tags: ["#Dodgers", "#StrikeoutProp", "#Sabermetrics"],
      gameContext: "Padres @ Dodgers",
      trendData: "Glasnow over 7.5 Ks in 4 of last 5 home starts"
    },
    likesCount: 14,
    commentsCount: 2,
    vouchesCount: 8,
    repostsCount: 3,
    comments: [
      {
        id: "c-1",
        postId: "post-1",
        userId: "u-analyst",
        displayName: "SharpPropAnalyst",
        username: "sharp_props",
        timestamp: "2026-06-19T10:45:00-07:00",
        content: "Totally agree on the sweeper matchup. Padres bottom half of the order struggles mightily against off-speed high spin rates.",
        likesCount: 3
      },
      {
        id: "c-2",
        postId: "post-1",
        userId: "u-fan",
        displayName: "SlamDiegoFan",
        username: "sd_dieghard",
        timestamp: "2026-06-19T10:50:00-07:00",
        content: "Padres have been hot though! Hard to bet against Bogaerts since he returned. But the numbers don't lie.",
        likesCount: 1
      }
    ]
  },
  {
    id: "post-2",
    userId: "sharp_props",
    displayName: "SharpPropAnalyst",
    username: "sharp_props",
    isVerified: false,
    timestamp: "2026-06-19T09:12:00-07:00",
    sportBadge: "MLB",
    sourceBadge: "Community",
    postType: "PARLAY",
    profileThemeId: "vaporwave_sunset",
    profileBorderId: "neon_neon",
    content: "Locking in a 2-leg pitching parlay for today's action. Verified odds at DraftKings. High risk, keep wagers standard.",
    parlay: {
      id: "p-seed-1",
      title: "Friday Pitching Edge",
      legs: [
        {
          id: "leg-1",
          sport: "MLB",
          game: "Padres @ Dodgers",
          market: "Player Strikeouts",
          selection: "Tyler Glasnow Over 6.5 Ks",
          odds: 1.74, // Decimal (-135 American)
          status: "PENDING"
        },
        {
          id: "leg-2",
          sport: "MLB",
          game: "Yankees @ Red Sox",
          market: "Player To Record a Win",
          selection: "Gerrit Cole to Record a Win",
          odds: 2.10, // Decimal (+110 American)
          status: "PENDING"
        }
      ],
      totalOdds: "+265",
      oddsValue: 3.65,
      riskTier: "MEDIUM",
      status: "PENDING",
      bookie: "DraftKings",
      createdAt: "2026-06-19T09:12:00-07:00"
    },
    likesCount: 22,
    commentsCount: 3,
    vouchesCount: 11,
    repostsCount: 5,
    comments: []
  },
  {
    id: "post-3",
    userId: "ve_model_mlb",
    displayName: "VouchEdge AI Model",
    username: "ve_model_mlb",
    isVerified: true,
    timestamp: "2026-06-18T18:00:00-07:00",
    sportBadge: "MLB",
    sourceBadge: "AI Pick",
    postType: "RESULT",
    profileThemeId: "cyber-blue",
    profileBorderId: "cyber_glow_pulse",
    content: "Yesterday's AI High-Probability Model play settled. Full transparent tracking shown below. Units logged to profile.",
    result: {
      status: "WON",
      units: 2.5,
      profit: 3.12,
      marketName: "Braves Strikeouts Prop",
      details: "Max Fried Over 5.5 Strikeouts — Result: 7 Strikeouts (WIN)"
    },
    likesCount: 18,
    commentsCount: 1,
    vouchesCount: 4,
    repostsCount: 1,
    comments: []
  },
  {
    id: "post-4",
    userId: "community_vouch",
    displayName: "EdgeVouch Bot",
    username: "edge_vouchers",
    isVerified: false,
    timestamp: "2026-06-19T08:00:00-07:00",
    sportBadge: "MLB",
    sourceBadge: "Vouches",
    postType: "VOUCH",
    profileThemeId: "matrix_flow",
    profileBorderId: "neon_matrix",
    content: "Spotted significant community movement. Multiple top proof-builders have vouched for this player prop prop today. Added to research board.",
    vouch: {
      id: "v-seed-1",
      vouchSource: "5 Top Pros",
      userNote: "Vouched for solid wind conditions in Boston (blowing out to left-center 14mph). Boosts heavy hitters.",
      market: "To Hit a Home Run",
      sport: "MLB",
      playerOrTeam: "Aaron Judge",
      gameName: "Yankees @ Red Sox",
      odds: "+240",
      status: "PENDING",
      savedCount: 14,
      vouchedCount: 28,
      createdAt: "2026-06-19T08:00:00-07:00"
    },
    likesCount: 12,
    commentsCount: 0,
    vouchesCount: 6,
    repostsCount: 2,
    comments: []
  }
];
