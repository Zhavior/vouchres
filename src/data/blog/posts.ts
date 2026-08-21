export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown string
  date: string;
  tag: string;
  author: string;
  authorRole: string;
  readTime: string;
  featured?: boolean;
  colorAccent: 'cyan' | 'emerald' | 'amber' | 'purple';
  keyTakeaway: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'open-beta-live',
    title: 'VouchEdge Open Beta is Live: Sourced Evidence Over Synthetic Locks.',
    excerpt: 'The evidence ledger is officially open. We are onboarding the first cohort of MLB analysts into the production intelligence environment.',
    date: 'August 20, 2026',
    tag: 'Release Notes',
    author: 'Boyd R. Santos',
    authorRole: 'Founder & Chief Architect',
    readTime: '3 MIN READ',
    featured: true,
    colorAccent: 'cyan',
    keyTakeaway: 'The public beta opens access to real-time HRPI calculations and cryptographic ledger validation.',
    content: `
# The Open Beta is Here.

After months of rigorous internal testing, stress-testing real-time Statcast pitch pipelines, and building immutable pick verification, we are officially opening the VouchEdge Beta to our first wave of public analysts.

---

## Why VouchEdge Exists

Sports analytics today is polluted by marketing hype:
* Aggressive claims of *"95% guaranteed lock"* algorithms.
* Ghost-editing loss records after the game ends.
* Completely opaque "AI models" with zero sourced evidence.

**VouchEdge was engineered as the antidote.**

We built an intelligence environment for analysts who demand **sourced evidence**, **explicit coverage gaps**, and **honest post-game review**. We do not synthesize confidence; we expose reality.

---

### Core Architecture Capabilities in Phase 1:

1. **The Real-Time HRPI Board**: Calculates pitcher vulnerability, park factors, barrel rates, and wind velocity into an objective home run probability index.
2. **Immutable Proof Ledgers**: Cryptographically locked timestamps. When first pitch is thrown, the ledger freezes. Bad picks cannot be deleted, good picks cannot be edited.
3. **Explicit Coverage Gaps**: If the weather station is down or the lineup hasn't dropped, we flag it in red. We never synthesize numbers to fill a blank.

---

## How to Access the Beta

We are rolling out seats in controlled cohorts to guarantee sub-50ms API latencies across our live MLB stat engine. Click **JOIN BETA** in the navigation header to reserve your seat in Cohort 1.

Welcome to the future of sports research.
`
  },
  {
    id: '2',
    slug: 'rejecting-synthetic-win-rates',
    title: 'The Mathematical Reason We Rejected Synthetic Win-Rates',
    excerpt: 'Why "95% lock" models are statistically fraudulent and how transparent probability distribution protects analysts from catastrophic drawdown.',
    date: 'August 12, 2026',
    tag: 'Methodology',
    author: 'Quantitative Team',
    authorRole: 'Probability Systems',
    readTime: '5 MIN READ',
    colorAccent: 'emerald',
    keyTakeaway: 'Probability is not a promise. Exposing variance and data gaps is the only mathematically honest approach.',
    content: `
# The Mathematical Fraud of "Guaranteed Locks"

In retail sports analytics, you frequently see flashy dashboards claiming:
> *"Our AI has determined this bet has a 94.8% chance of winning!"*

As engineers and quantitative researchers, **we strictly refused to build synthetic win-rates into VouchEdge.**

---

## 1. Variance Is Non-Negotiable

A batter can have an optimal 112mph exit velocity at a 28-degree launch angle with a 15mph tailwind—and a center fielder makes a leaping catch at the wall.

Sports outcomes are governed by heavy-tailed probability distributions. Attempting to reduce thousands of chaotic real-world variables into an absolute "lock" is mathematical dishonesty designed to sell subscriptions.

---

## 2. The Sourced Evidence Standard

Instead of telling you *what to think*, VouchEdge gives you the raw underlying distribution:
* **Pitcher HR/9 vs Handedness**: Exact rolling Statcast splits.
* **Barrels / Plate Appearance**: 14-day recency vs season baseline.
* **Park & Meteorological Index**: Barometric pressure, humidity, and wind vector.

You see every input that went into the calculation. **No black boxes. No hallucinated guarantees.**
`
  },
  {
    id: '3',
    slug: 'architecting-the-aurora-engine',
    title: 'Architecting Aurora: 60fps GPU Acceleration in a React App Shell',
    excerpt: 'A deep dive into our custom Three.js WebGL canvas bridge and how we maintain sub-millisecond DOM responsiveness during live game feeds.',
    date: 'July 05, 2026',
    tag: 'Engineering',
    author: 'Frontend Systems',
    authorRole: 'GPU & UI Engineering',
    readTime: '6 MIN READ',
    colorAccent: 'purple',
    keyTakeaway: 'Offloading background render loops to WebGL keeps the React main thread free for high-speed live data streams.',
    content: `
# High-Density Visual Telemetry Without Main-Thread Lag

When designing the VouchEdge interface, we wanted the app to feel like an aerospace heads-up display (HUD).

However, rendering complex particle fields, dynamic gradient waves, and real-time odds updates using traditional CSS and DOM nodes quickly causes frame drops.

---

## The Aurora WebGL Pipeline

To achieve 60fps performance across low-end mobile devices and 4K displays alike, we decoupled the visual atmosphere from the React component tree:

\`\`\`typescript
// The WebGL Canvas runs as an isolated background sibling
<GlobalCanvasRoot />
<div className="relative z-10">
  <MainAppRouter />
</div>
\`\`\`

### Architecture Highlights:
* **GPU Offload**: Background shaders render on a dedicated WebGL rendering context.
* **Zero Layout Thrashing**: CSS transformations use \`transform\` and \`opacity\` exclusively.
* **Strict Memory Isolation**: Shaders and geometry buffers are disposed cleanly when transitioning to high-frequency live boards.

The result is instant UI responsiveness, zero render lag, and a visual aesthetic unlike any sports application on the market.
`
  }
];
