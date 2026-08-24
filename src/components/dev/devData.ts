/**
 * /dev — source of truth for the operator page.
 *
 * Everything here is carried over verbatim from the previous DevProfilePage
 * implementation. Nothing in this file is invented: no metrics, no counts, no
 * accuracy claims. If a fact is not already true in the repository it does not
 * appear here.
 */

export type Accent = 'cyan' | 'emerald' | 'amber';

export const OPERATOR = {
  name: 'Boyd R. Santos',
  givenName: 'Boyd R.',
  familyName: 'Santos',
  monogram: 'BRS',
  title: 'Founder & Systems Architect',
  designation: 'OPERATOR 001',
  status: 'SYSTEM ONLINE',
  location: 'Dartmouth, Nova Scotia, Canada',
  locationShort: 'DARTMOUTH // NS // CAN',
  flag: '🇨🇦',
  attestation: 'Verified Cryptographic Node',
  key: '0x7F8C91A2B4E5D6 // NODE-001-CAN',
  github: 'https://github.com/Zhavior',
  linkedin: 'https://www.linkedin.com/in/reinaldsantos',
  contact: '/contact',
} as const;

export interface Venture {
  id: string;
  name: string;
  url: string;
  displayUrl: string;
  role: string;
  tag: string;
  accent: Accent;
  description: string;
  highlights: string[];
}

export const VENTURES: Venture[] = [
  {
    id: 'vouchedge',
    name: 'VouchEdge',
    url: 'https://vouchedge.xyz',
    displayUrl: 'vouchedge.xyz',
    role: 'Founder & Chief Architect',
    tag: 'SPORTS INTELLIGENCE',
    accent: 'cyan',
    description:
      'MLB decision intelligence and real-time probability distribution engine. Features SHA-256 cryptographic ledgers to end the era of deleted losses and fake locks.',
    highlights: [
      'Real-Time Statcast Feeds',
      'HRPI Probability Modeling',
      'Zero-Hallucination UI',
      'Immutable Proof Engine',
    ],
  },
  {
    id: 'seolaquest',
    name: 'SEOlaQuest',
    url: 'https://seolaquest.com',
    displayUrl: 'seolaquest.com',
    role: 'Founder & Lead Developer',
    tag: 'AI SOCIAL LISTENING',
    accent: 'amber',
    description:
      'AI-powered social listening, lead monitoring, and buyer-intent detection across X (Twitter) and Reddit for high-velocity SaaS founders and operators.',
    highlights: [
      'Real-Time Intent Monitoring',
      'Multi-Platform AI Scouts',
      'Gamified Lead Arcade',
      'Sub-Minute Alerts',
    ],
  },
];

/**
 * Engineering philosophy — the heading, the operator quote, and the closing
 * thesis are the previous page's copy, unchanged.
 */
export const PHILOSOPHY = {
  heading: 'Tired of Losses & Scams. Built for Decision Intelligence.',
  quote:
    'I was tired of seeing people lose their hard-earned money blindly, and tired of watching everyday bettors get scammed by fake ‘lock’ sellers. I created VouchEdge to give people real tools to make informed decisions and truly understand what they are betting on.',
  thesisLead:
    'Whether building MLB Statcast predictive engines on VouchEdge or real-time social lead intelligence on SEOlaQuest, the core thesis is identical:',
  /**
   * The three principles are the three clauses of the thesis sentence above,
   * split for hierarchy. No new claims are introduced.
   */
  principles: [
    { id: '01', title: 'Eradicate black boxes', accent: 'cyan' as Accent },
    { id: '02', title: 'Eliminate fake promises', accent: 'emerald' as Accent },
    { id: '03', title: 'Arm operators with sourced, verifiable telemetry', accent: 'cyan' as Accent },
  ],
};

export interface RegistryEntry {
  system: string;
  /** Terse, factual description of what the technology does. */
  fn: string;
  accent: Accent;
}

export interface RegistryLayer {
  id: string;
  category: string;
  /** Short machine label for the layer. */
  code: string;
  entries: RegistryEntry[];
}

/**
 * Technical architecture matrix, restructured as a registry. The `category`
 * groups and every `system` string are unchanged from the previous TECH_STACK
 * constant. `fn` is a plain description of the technology, and `accent` follows
 * the page colour semantics: cyan = engineering surface, emerald = VouchEdge
 * evidence/intelligence, amber = SEOlaQuest.
 */
export const REGISTRY: RegistryLayer[] = [
  {
    id: 'frontend',
    category: 'Core Frontend',
    code: 'INTERFACE',
    entries: [
      { system: 'React 19', fn: 'Component runtime', accent: 'cyan' },
      { system: 'TypeScript', fn: 'Static type layer', accent: 'cyan' },
      { system: 'Vite', fn: 'Build & dev server', accent: 'cyan' },
      { system: 'Tailwind CSS', fn: 'Utility style system', accent: 'cyan' },
      { system: 'Framer Motion', fn: 'Interface motion', accent: 'cyan' },
    ],
  },
  {
    id: 'graphics',
    category: 'GPU & Graphics',
    code: 'RENDER',
    entries: [
      { system: 'WebGL Shaders', fn: 'GPU fragment programs', accent: 'cyan' },
      { system: 'Three.js', fn: '3D scene graph', accent: 'cyan' },
      { system: 'Aurora Engine', fn: 'In-house render layer', accent: 'cyan' },
      { system: '60fps HUD Canvas', fn: 'Canvas telemetry surface', accent: 'cyan' },
    ],
  },
  {
    id: 'backend',
    category: 'Backend & Systems',
    code: 'INFRASTRUCTURE',
    entries: [
      { system: 'Node.js / Express', fn: 'Application server', accent: 'cyan' },
      { system: 'Supabase (PostgreSQL)', fn: 'Relational store & auth', accent: 'cyan' },
      { system: 'Redis / Upstash', fn: 'Cache & ephemeral state', accent: 'cyan' },
      { system: 'SendGrid Email Pipeline', fn: 'Transactional delivery', accent: 'cyan' },
    ],
  },
  {
    id: 'intelligence',
    category: 'Intelligence & Telemetry',
    code: 'SIGNAL',
    entries: [
      { system: 'MLB Statcast Live Feed', fn: 'Primary data ingestion', accent: 'emerald' },
      { system: 'SHA-256 Proof Ledgers', fn: 'Immutable audit hashing', accent: 'emerald' },
      { system: 'AI Social Scouts', fn: 'Multi-platform monitoring', accent: 'amber' },
      { system: 'Real-Time Intent Parsing', fn: 'Buyer-signal classification', accent: 'amber' },
    ],
  },
];

/** Tailwind class maps. Keeping these static keeps every class statically analysable. */
export const ACCENT_TEXT: Record<Accent, string> = {
  cyan: 'text-ve-cyan',
  emerald: 'text-ve-emerald',
  amber: 'text-ve-amber',
};

export const ACCENT_BG: Record<Accent, string> = {
  cyan: 'bg-ve-cyan',
  emerald: 'bg-ve-emerald',
  amber: 'bg-ve-amber',
};

export const ACCENT_BORDER: Record<Accent, string> = {
  cyan: 'border-ve-cyan/30',
  emerald: 'border-ve-emerald/30',
  amber: 'border-ve-amber/30',
};

export const ACCENT_HOVER_TEXT: Record<Accent, string> = {
  cyan: 'group-hover:text-ve-cyan',
  emerald: 'group-hover:text-ve-emerald',
  amber: 'group-hover:text-ve-amber',
};
