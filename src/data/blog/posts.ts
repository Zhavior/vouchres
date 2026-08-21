export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown string
  date: string;
  tag: string;
  author: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'open-beta-live',
    title: 'VouchEdge Open Beta is live.',
    excerpt: 'The evidence ledger is officially open. We are onboarding the first wave of beta testers into the production environment today.',
    date: 'August 20, 2026',
    tag: 'Release Notes',
    author: 'Boyd R. Santos',
    content: `
# The Open Beta is Here.

After months of rigorous internal testing, we are officially opening the VouchEdge Beta to our first wave of public analysts.

## What is VouchEdge?

VouchEdge is built to provide MLB research tools for analysts who demand sourced evidence, explicit coverage gaps, and honest post-game review. We do not synthesize confidence; we expose reality.

### Phase 1 Features:
* **The HRPI Board**: Real-time home run probability index tracking.
* **Immutable Ledgers**: Cryptographically locked picks.
* **Zero Hallucination UI**: If data is missing, we tell you. We don't guess.

## How to get access

If you haven't already, click the **JOIN BETA** button in the top right. We are rolling out access in cohorts to ensure server stability.

Welcome to the future of sports analytics.
`
  },
  {
    id: '2',
    slug: 'rejecting-synthetic-win-rates',
    title: 'Why we rejected synthetic win-rates.',
    excerpt: 'Sports analytics is plagued by "95% guaranteed lock" models. Here is the mathematical and philosophical reason VouchEdge refuses to compute them.',
    date: 'August 12, 2026',
    tag: 'Methodology',
    author: 'Engineering Team',
    content: `
# The Problem with "Locks"

In the sports analytics space, you see it everywhere: *"95% Guaranteed Lock"* or *"AI Predicted Sure-Fire Winner"*. 

**We refuse to build this into VouchEdge.**

## The Philosophy

When you synthesize a "confidence score" out of thin air to sell a subscription, you are actively harming the analyst. 

1. **Variance is real.** A 100mph line drive can go right into a shortstop's glove.
2. **Data has gaps.** You cannot predict the future if you don't have the starting lineup until 30 minutes before first pitch.

## Our Solution: Exposing Reality

Instead of giving you a fake 95% win-rate, VouchEdge exposes the *raw, unvarnished truth*. 

* What is the pitcher's actual HR/9 against righties?
* What is the current wind speed at the stadium?
* What is the batter's barrel rate over the last 14 days?

We give you the evidence. **You make the call.**
`
  },
  {
    id: '3',
    slug: 'architecting-the-aurora-engine',
    title: 'Architecting the Aurora Engine',
    excerpt: 'A deep dive into how we built the high-performance WebGL rendering engine that powers the VouchEdge interface.',
    date: 'July 05, 2026',
    tag: 'Engineering',
    author: 'Frontend Team',
    content: `
# Building Aurora

VouchEdge doesn't look like a standard web app because it isn't built like one.

We wanted the interface to feel like a high-end HUD (Heads Up Display). To achieve this, we built a custom WebGL rendering pipeline we call **Aurora**.

## WebGL over DOM

Standard DOM elements are great for forms and text, but when you want to render thousands of data points or complex background particle fields, the DOM crawls to a halt.

By offloading the background visuals to the GPU via WebGL, the main thread remains completely free to handle data fetching, React state, and complex animations.

### The Stack:
* React (UI Shell)
* Framer Motion (Micro-interactions)
* Three.js (WebGL Canvas)
* Tailwind CSS (Styling)

The result is a butter-smooth 60fps experience, even when rendering dense datasets.
`
  }
];
