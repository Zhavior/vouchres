import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getDefaultLayout, getSidebarFeatures } from '../src/lib/featureConfig';

describe('focused beta shell', () => {
  it('limits the default sidebar to the paid MLB workflow', () => {
    expect(getSidebarFeatures(getDefaultLayout()).map((feature) => feature.id)).toEqual([
      'today',
      'hr_board',
      'results',
      'premium',
    ]);
  });

  it('removes fabricated consensus and payment-based verification claims', () => {
    const social = readFileSync('src/features/hr/components/Social/MostVouchedCard.tsx', 'utf8');
    const premium = readFileSync('src/components/PremiumSubPage.tsx', 'utf8');
    const settings = readFileSync('src/components/SettingsPageZ8.tsx', 'utf8');

    expect(social).not.toContain('consensusPct');
    expect(social).not.toContain('% Consensus');
    expect(premium).not.toContain('proSubscribed("unknown")');
    expect(premium).not.toContain('verified: subTier');
    expect(premium).not.toContain('Most Popular');
    expect(premium).not.toContain('Verification badge on posts');
    expect(premium).not.toContain('Stripe (test mode)');
    expect(premium).not.toContain("handleSubscribePlan('SELLER_PRO')");
    expect(settings).not.toContain("verified: nextTier !== 'BASIC'");
    expect(settings).not.toContain('verified profile perks');
  });

  it('keeps Today focused on four workflow actions without social proof panels', () => {
    const today = readFileSync('src/components/TodayDashboardZ8.tsx', 'utf8');

    expect(today).toContain('4 Core Actions');
    expect(today).not.toContain('8 Core Systems');
    expect(today).not.toContain('MostVouchedPlayersPanel');
    expect(today).not.toContain('Following Hub');
  });

  it('uses the same global lineup counts in the toolbar and slate summary', () => {
    const page = readFileSync('src/features/hr/pages/HomeRunIntelligencePageZ8.tsx', 'utf8');
    const commandCenter = readFileSync('src/features/hr/components/CommandCenter/HrCommandCenter.tsx', 'utf8');

    expect(page).toContain('confirmedCount={vm.modeCounts?.confirmed ?? 0}');
    expect(page).toContain('previewCount={vm.modeCounts?.curated ?? 0}');
    expect(commandCenter).toContain('confirmedCount={props.confirmedCount}');
    expect(commandCenter).toContain('previewCount={props.previewCount}');
    expect(commandCenter).not.toContain('Math.max(0');
  });
});
