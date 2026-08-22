import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const landingSource = readFileSync(
  new URL('../src/pages/VouchEdgeLandingV3.tsx', import.meta.url),
  'utf8',
);
const authSource = readFileSync(
  new URL('../src/components/auth/AuthModal.tsx', import.meta.url),
  'utf8',
);
const authCss = readFileSync(
  new URL('../src/styles/auth-modal.css', import.meta.url),
  'utf8',
);

describe('landing mobile scrollytelling contract', () => {
  it('keeps the mobile HUD inside one dynamic viewport', () => {
    expect(landingSource).toContain('h-[100dvh]');
    expect(landingSource).toContain('flex-1 min-h-0 relative w-full');
    expect(landingSource).toContain('className="absolute inset-0 h-full w-full object-cover"');
    expect(landingSource).toContain('ve-optical-reticle');
    expect(landingSource).toContain('h-14 shrink-0');
    expect(landingSource).toContain('className="relative h-9 w-9 shrink-0 overflow-hidden');
    expect(landingSource).toContain('className="hidden md:flex"');
  });

  it('keeps login and signup visible as matched mobile navbar actions', () => {
    expect(landingSource).toContain('grid shrink-0 grid-cols-2 items-center');
    expect(landingSource).toContain('h-8 border border-white/20 bg-black');
    expect(landingSource).toContain('h-8 border-2 border-cyan-400 bg-cyan-400');
    expect(landingSource).toContain('LOG IN');
    expect(landingSource).toContain('SIGN UP');
  });

  it('continues the mobile slideshow into account access', () => {
    expect(authSource).toContain('scrollToAccountPanel');
    expect(authSource).toContain("'Continue to create account'");
    expect(authSource).toContain("'Continue to account access'");
    expect(authSource).toContain("window.matchMedia('(max-width: 767px)')");
    expect(authSource).toContain('focus({ preventScroll: true })');
    expect(authCss).toContain('.ve-auth-story-continue');
    expect(authCss).toContain('scroll-snap-type: y mandatory');
    expect(authCss).toContain('min-height: 100dvh');
    expect(authCss).toContain('scroll-snap-stop: always');
  });

  it('virtualizes the mobile signup policy instead of nesting a legal scroll box', () => {
    expect(authSource).toContain('policyIndex');
    expect(authSource).toContain('ve-auth-policy-carousel');
    expect(authSource).toContain('Previous policy');
    expect(authSource).toContain('Next policy');
    expect(authCss).toContain('.ve-auth-policy-list--desktop');
    expect(authCss).toContain('.ve-auth-policy-carousel-body');
    expect(authCss).toContain('.ve-auth-agreements');
  });

  it('gives all eight mobile slides one full scroll beat in a pinned deck', () => {
    expect(landingSource).toContain('relative h-[900dvh] w-full');
    expect(landingSource).toContain('sticky top-14 flex h-[calc(100dvh-56px)]');
    expect(landingSource).toContain('One record. Eight connected phases.');
    expect(landingSource).toContain('Scroll to advance ↓');

    for (const phase of ['LOCATE', 'CONNECT', 'ORGANIZE', 'RESOLVE', 'DECIDE', 'LOCK', 'COMPARE', 'LEARN']) {
      expect(landingSource).toContain(`return '${phase}'`);
    }
  });

  it('syncs the active phase to mobile scroll progress', () => {
    expect(landingSource).toContain('mobileScrollYProgress');
    expect(landingSource).toContain('Math.floor(normalizedProgress * 8) + 1');
    expect(landingSource).toContain('setActiveStory(nextStory)');
    expect(landingSource).toContain("aria-current={isActive ? 'step' : undefined}");
    expect(landingSource).toContain('mobile-phase-snap-rail');
    expect(landingSource).toContain('h-[100dvh] shrink-0 snap-start');
    expect(landingSource).toContain('initial={{ opacity: 0.65, y: 6 }}');
  });

  it('continues the slideshow through every remaining landing chapter', () => {
    expect(landingSource).toContain('ve-mobile-story');
    expect(landingSource.match(/ve-mobile-story-slide--/g)).toHaveLength(7);

    for (const chapter of ['03 / INTEGRITY', '04 / METHOD', '05 / COMMUNITY', '06 / ACCESS', '07 / FAQ', '08 / ACCESS', '09 / RECORD']) {
      expect(landingSource).toContain(`chapter="${chapter}"`);
    }
  });

  it('pulls the first post-pipeline chapter over the pipeline exit frame', () => {
    const mobileStoryCss = readFileSync(
      new URL('../src/styles/vouchedge-mobile-story.css', import.meta.url),
      'utf8',
    );

    expect(mobileStoryCss).toContain('scroll-snap-type: y mandatory');
    expect(mobileStoryCss).toContain('scroll-margin-top: 0 !important');
    expect(mobileStoryCss).toContain('.ve-mobile-story-slide--integrity');
    expect(mobileStoryCss).toContain('margin-top: -100dvh');
    expect(mobileStoryCss).toContain('flex-direction: column');
  });
});
