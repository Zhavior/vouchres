import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const authSource = readFileSync(
  new URL('../src/components/auth/AuthModal.tsx', import.meta.url),
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

describe('signup and first-session activation', () => {
  it('sends free signup directly to required policy review', () => {
    expect(authSource).toContain('useState<SignupPlan>(initialPlan)');
    expect(authSource).toContain("signupStep === 'policy'");
    expect(authSource).toContain("setSignupStep(m === 'signup' ? 'policy' : 'form')");
  });

  it('does not claim personalization from fake sport or team choices', () => {
    expect(onboardingSource).not.toContain('Yankees');
    expect(onboardingSource).not.toContain('Dodgers');
    expect(onboardingSource).not.toContain('NFL');
    expect(onboardingSource).not.toContain('NBA');
  });

  it('routes users directly to a working first action', () => {
    expect(onboardingSource).toContain("id: 'hr_board'");
    expect(onboardingSource).toContain("id: 'live_parlays'");
    expect(onboardingSource).toContain("id: 'profile'");
    expect(routerSource).toContain('navigateSection(section ?? "today")');
  });
});
