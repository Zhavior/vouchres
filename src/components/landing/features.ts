import {
  BarChart3,
  LayoutGrid,
  FlaskConical,
  Users,
} from "lucide-react";

export const FEATURES = [
  {
    icon: BarChart3,
    eyebrow: 'HR Intelligence',
    title: 'Verified home run intelligence',
    copy: 'Trust-first HR Intelligence with confirmed lineups only. Projected previews are clearly labeled — never sold as confirmed.',
    route: 'hr_max',
  },
  {
    icon: LayoutGrid,
    eyebrow: 'Edge Island',
    title: 'Your command center',
    copy: 'Live slate navigation, matchup context, and edge signals in one obsidian workspace — built for speed on game day.',
    route: 'island',
  },
  {
    icon: FlaskConical,
    eyebrow: 'Matchup Research',
    title: 'A clear research room',
    copy: 'Review today\'s player and matchup context, build your own card, and see what is confirmed versus projected.',
    route: 'mlb_intelligence',
  },
  {
    icon: Users,
    eyebrow: 'Daily Players',
    title: 'Slate-wide player research',
    copy: 'Deep player cards, headshots, and stat context across the full daily player pool — live when signed in.',
    route: 'daily_players',
  },
] as const;
