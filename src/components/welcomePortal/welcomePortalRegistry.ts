export type WelcomePillarId = 'vouch' | 'social' | 'research';
export type WelcomeThemeId = 'ocean' | 'midnight' | 'gold';
export type PricingTierId = 'free' | 'edge' | 'pro';

export type WelcomePillar = {
  id: WelcomePillarId;
  title: string;
  eyebrow: string;
  headline: string;
  description: string;
  bullets: string[];
  section: string;
  accent: 'cyan' | 'violet' | 'amber';
};

export type PricingTier = {
  id: PricingTierId;
  name: string;
  price: string;
  subtitle: string;
  badge?: string;
  cta: string;
  section: string;
  features: {
    label: string;
    included: boolean;
    pro?: boolean;
  }[];
};

export type AmplifierSlide = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  section: string;
};

export type WelcomeThemeChoice = {
  id: WelcomeThemeId;
  name: string;
  subtitle: string;
  description: string;
  preview: string;
  className: string;
};

export const WELCOME_PILLARS: WelcomePillar[] = [
  {
    id: 'vouch',
    title: 'Vouch',
    eyebrow: 'Proof-first picks',
    headline: 'Trust should be visible.',
    description: 'Track picks, grade results, and build a proof profile instead of relying on hype.',
    bullets: ['Verified pick ledger', 'Win/loss grading', 'Public trust profile', 'Capper score system'],
    section: 'results',
    accent: 'cyan',
  },
  {
    id: 'social',
    title: 'Social',
    eyebrow: 'Community edge',
    headline: 'Follow people with receipts.',
    description: 'Post slips, follow cappers, compare performance, and build a reputation inside the feed.',
    bullets: ['Vouch feed', 'Follow cappers', 'Share parlays', 'Creator proof cards'],
    section: 'feed',
    accent: 'violet',
  },
  {
    id: 'research',
    title: 'Research',
    eyebrow: 'Serious analysis',
    headline: 'Study before you build.',
    description: 'Use Daily Players, HR Board, matchup history, and AI guidance before saving picks.',
    bullets: ['Daily Players', 'HR Board', 'Pitcher vulnerability', 'AI Seat ready'],
    section: 'daily_players',
    accent: 'amber',
  },
];

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    subtitle: 'For exploring the board.',
    cta: 'Start Free',
    section: 'feed',
    features: [
      { label: 'Welcome Portal', included: true },
      { label: 'Daily board preview', included: true },
      { label: 'Basic pick feed', included: true },
      { label: 'Limited saved picks', included: true },
      { label: 'Deep player research', included: false, pro: true },
      { label: 'Pro AI Seat tools', included: false, pro: true },
    ],
  },
  {
    id: 'edge',
    name: 'Edge',
    price: '$9',
    subtitle: 'For active users building slips.',
    badge: 'Best Start',
    cta: 'Choose Edge',
    section: 'build',
    features: [
      { label: 'Full Daily Players', included: true },
      { label: 'Parlay builder', included: true },
      { label: 'Pick ledger', included: true },
      { label: 'More saved picks', included: true },
      { label: 'Basic alerts', included: true },
      { label: 'Pro AI Seat tools', included: false, pro: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    subtitle: 'For research-heavy users.',
    badge: 'Pro',
    cta: 'Unlock Pro',
    section: 'research',
    features: [
      { label: 'Deep player research', included: true },
      { label: 'HR graphs', included: true },
      { label: 'Pitcher vulnerability', included: true },
      { label: 'Premium alerts', included: true },
      { label: 'Pro AI Seat tools', included: true },
      { label: 'Advanced proof insights', included: true },
    ],
  },
];

export const AMPLIFIER_SLIDES: AmplifierSlide[] = [
  {
    id: 'vouch-proof',
    title: 'Vouch',
    subtitle: 'Proof over hype.',
    description: 'Every serious user needs receipts. Start tracking your picks, results, and public trust profile.',
    bullets: ['Save picks', 'Grade results', 'Build your ledger'],
    section: 'results',
  },
  {
    id: 'social-feed',
    title: 'Social',
    subtitle: 'Find people worth following.',
    description: 'The feed is not just noise. It becomes a proof layer where cappers earn trust through results.',
    bullets: ['Post parlays', 'Follow cappers', 'Compare win rates'],
    section: 'feed',
  },
  {
    id: 'research-lab',
    title: 'Research',
    subtitle: 'Study before the slip.',
    description: 'Use Daily Players, HR Board, and AI Seat guidance before building your next card.',
    bullets: ['Daily Players', 'HR Board', 'AI Seat'],
    section: 'daily_players',
  },
];

export const THEME_CHOICES: WelcomeThemeChoice[] = [
  {
    id: 'ocean',
    name: 'Ocean Edge',
    subtitle: 'Default',
    description: 'Cyan, deep navy, smooth AI-command energy.',
    preview: 'Cyan tide glass',
    className: 'from-cyan-300/30 via-sky-500/20 to-slate-950',
  },
  {
    id: 'midnight',
    name: 'Midnight Pro',
    subtitle: 'Research',
    description: 'Graphite, violet, and serious pro-lab contrast.',
    preview: 'Violet graphite',
    className: 'from-violet-400/30 via-indigo-500/20 to-slate-950',
  },
  {
    id: 'gold',
    name: 'Gold Vouch',
    subtitle: 'Proof',
    description: 'Black and gold for trust, proof, and capper prestige.',
    preview: 'Gold proof glass',
    className: 'from-amber-300/30 via-yellow-600/20 to-slate-950',
  },
];
