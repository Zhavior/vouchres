import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Plan, billing, and Settings Aurora Max contract', () => {
  it('uses shared Aurora Max primitives without legacy Aurora tokens', () => {
    const premium = readFileSync('src/components/PremiumSubPage.tsx', 'utf8');
    const settings = readFileSync('src/components/SettingsPageZ8.tsx', 'utf8');

    for (const page of [premium, settings]) {
      expect(page).toContain('AuroraMaxCommandHeader');
      expect(page).toContain('AuroraMaxPanel');
      expect(page).toContain('AuroraMaxControl');
      expect(page).not.toContain('auroraTokens');
      expect(page).not.toContain('AURORA_');
      expect(page).not.toContain('premiumAurora');
    }
  });

  it('keeps the narrow-screen layout explicit and overflow-safe', () => {
    const premium = readFileSync('src/components/PremiumSubPage.tsx', 'utf8');
    const settings = readFileSync('src/components/SettingsPageZ8.tsx', 'utf8');
    const styles = readFileSync('src/components/billing-settings-aurora-max.css', 'utf8');

    expect(premium).toContain('min-w-0');
    expect(settings).toContain('overflow-x-hidden');
    expect(settings).toContain('settings-mobile-tabs');
    expect(styles).toContain('@media (max-width: 639px)');
    expect(styles).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
    expect(styles).toContain('border-radius: 0 !important');
    expect(styles).toContain('#inner-view-slot :is(.billing-aurora-max, .settings-aurora-max)');
  });
});
