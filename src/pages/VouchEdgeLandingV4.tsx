import React, { useEffect } from 'react';
import Navbar from '../components/landing-v4/Navbar';
import Hero from '../components/landing-v4/Hero';
import ProductStory from '../components/landing-v4/ProductStory';
import ProductGallery from '../components/landing-v4/ProductGallery';
import StadiumIntelligence from '../components/landing-v4/StadiumIntelligence';
import MethodologyEngine from '../components/landing-v4/MethodologyEngine';
import AuditContrast from '../components/landing-v4/AuditContrast';
import CommunityInvitation from '../components/landing-v4/CommunityInvitation';
import FinalStatement from '../components/landing-v4/FinalStatement';
import AccessTiers from '../components/landing-v4/AccessTiers';
import AuditedTrackRecord from '../components/landing-v4/AuditedTrackRecord';
import PublicFooter from '../components/landing-v4/PublicFooter';


/**
 * Fragment navigation for the landing.
 *
 * `/#intelligence` arriving from /dev, /blog or /contact used to land at the top
 * of the page: the landing is a lazy chunk, so by the time `#intelligence` exists
 * in the DOM the browser has long since given up on the fragment. Retry briefly
 * until the target mounts, then scroll. `scroll-mt-20` on the target sections
 * keeps the heading clear of the fixed navbar.
 */
function useHashScroll() {
  useEffect(() => {
    let timer = 0;
    let attempts = 0;

    const scrollToHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) {
        // Timer rather than rAF: rAF is suspended in a backgrounded tab, which
        // would strand the retry for anyone who opens the link in a new tab.
        if (attempts++ < 40) timer = window.setTimeout(scrollToHash, 16);
        return;
      }

      attempts = 0;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        return;
      }

      const before = window.scrollY;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Smooth scrolling is a no-op in a backgrounded tab. Land the visitor on
      // the section anyway rather than leaving them at the top of the page.
      timer = window.setTimeout(() => {
        if (Math.abs(window.scrollY - before) < 2) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }, 400);
    };

    timer = window.setTimeout(scrollToHash, 0);
    window.addEventListener('hashchange', scrollToHash);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', scrollToHash);
    };
  }, []);
}

export default function VouchEdgeLandingV4() {
  useHashScroll();

  return (
    <div className="bg-obsidian-900 text-white selection:bg-ve-emerald/30 font-sans">
      <Navbar />
      
      <Hero />

      {/* 01 / THE THESIS */}
      <section className="px-6 py-28 bg-obsidian-950 lg:py-36">
        <div className="container mx-auto max-w-5xl space-y-10 text-center lg:space-y-12">
          <span className="terminal-text opacity-20">01 / THE_THESIS</span>
          <h2 className="text-6xl md:text-8xl font-bold tracking-tighter italic leading-[0.9] text-white">
            Sports predictions have <br />
            <span className="text-white/10">a memory problem.</span>
          </h2>
          <div className="grid grid-cols-1 gap-10 border-t border-white/5 pt-12 text-left md:grid-cols-2 md:gap-16">
            <p className="text-xl text-white/55 font-light leading-relaxed">
              The winners get screenshotted. The misses disappear. Confidence changes after the game. Missing evidence gets forgotten.
            </p>
            <p className="text-xl text-ve-emerald font-light leading-relaxed">
              VouchEdge records what the model knew before the game happened. We lock the evidence, the confidence, and the receipt. Accountability is the only edge.
            </p>
          </div>
        </div>
      </section>

      <ProductStory />

      <ProductGallery />

      <StadiumIntelligence />

      <MethodologyEngine />

      <AuditContrast />


      <AuditedTrackRecord />

      <AccessTiers />

      <CommunityInvitation />

      <FinalStatement />

      <PublicFooter />
    </div>
  );
}
