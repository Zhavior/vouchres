import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const authSource = readFileSync(
  new URL('../src/components/auth/AuthModal.tsx', import.meta.url),
  'utf8',
);
const authStyles = readFileSync(
  new URL('../src/styles/auth-modal.css', import.meta.url),
  'utf8',
);
const onboardingSource = readFileSync(
  new URL('../src/components/onboarding/PersonalizedOnboarding.tsx', import.meta.url),
  'utf8',
);
const routerSource = readFileSync(
  new URL('../src/components/routing/MainViewRouter.tsx', import.meta.url),
  'utf8',
);
const landingSource = readFileSync(
  new URL('../src/pages/VouchEdgeTerminalPage.tsx', import.meta.url),
  'utf8',
);
const landingFaqSource = readFileSync(
  new URL('../src/components/landing/LandingFAQ.tsx', import.meta.url),
  'utf8',
);

describe('signup and first-session activation', () => {
  it('keeps the restored intro, questionnaire, plan, policy, and account creation flow', () => {
    expect(authSource).toContain('useState<SignupPlan>(initialPlan)');
    expect(authSource).toContain("initialMode === 'signup' ? (initialPlan === 'free' ? 'policy' : 'plan') : 'form'");
    expect(authSource).toContain("signupStep === 'intro'");
    expect(authSource).toContain("signupStep === 'questionnaire'");
    expect(authSource).toContain("signupStep === 'plan'");
    expect(authSource).toContain("signupStep === 'policy'");
    expect(authSource).toContain("setSignupStep('questionnaire')");
    expect(authSource).toContain("setSignupStep('plan')");
    expect(authSource).toContain("setSignupStep(m === 'signup' ? 'policy' : 'form')");
    expect(authSource).toContain('AuthJudgeWelcome');
  });

  it('keeps the desktop signup form from collapsing beside the judge panel', () => {
    expect(authSource).toContain('ve-auth-judge-panel');
    expect(authSource).toContain('ve-auth-form-panel');
    expect(authStyles).toContain('.ve-auth-dialog');
    expect(authStyles).toContain('max-width: 56rem');
    expect(authStyles).toContain('flex: 0 0 clamp(16.25rem, 38%, 20rem)');
    expect(authStyles).toContain('flex: 1 1 0%');
  });

  it('explains the live confirmation-email limit without blaming the user', () => {
    expect(authSource).toContain("m.includes('email rate limit')");
    expect(authSource).toContain('Confirmation email sending is temporarily at its limit.');
  });

  it('does not claim personalization from fake sport or team choices', () => {
    expect(onboardingSource).not.toContain('Yankees');
    expect(onboardingSource).not.toContain('Dodgers');
    expect(onboardingSource).not.toContain('NFL');
    expect(onboardingSource).not.toContain('NBA');
  });

  it('keeps the public signup and landing copy research-first', () => {
    expect(landingSource).toContain("eyebrow: 'Matchup Research'");
    expect(landingSource).not.toContain('AI Edge Lab');
    expect(landingSource).not.toContain('Judge-powered');
    expect(landingFaqSource).toContain('Where does the research come from?');
    expect(landingFaqSource).not.toContain('AI Judges');
  });

  it('routes users directly to a working first action', () => {
    expect(onboardingSource).toContain("id: 'hr_board'");
    expect(onboardingSource).toContain("id: 'live_parlays'");
    expect(onboardingSource).toContain("id: 'profile'");
    expect(routerSource).toContain('navigateSection(section ?? "today")');
  });
});
