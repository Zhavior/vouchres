import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const authSource = readFileSync(
  new URL('../src/components/auth/AuthModal.tsx', import.meta.url),
  'utf8',
);
const authCss = readFileSync(
  new URL('../src/styles/auth-modal.css', import.meta.url),
  'utf8',
);

describe('mobile account access contract', () => {


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




});
