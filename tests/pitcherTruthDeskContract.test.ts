import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Pitcher Truth Desk contract', () => {
  const page = readFileSync('src/pages/pro/PitcherMatchupIntelligencePageZ8.tsx', 'utf8');
  const router = readFileSync('src/components/routing/MainViewRouter.tsx', 'utf8');
  const features = readFileSync('src/lib/featureConfig.ts', 'utf8');
  const css = readFileSync('src/pages/pro/pitcher-truth-desk.css', 'utf8');
  const service = readFileSync('server/services/mlb/pitcherMatchupService.ts', 'utf8');
  const drawer = readFileSync('src/components/matchups/PitcherMatchupDrawer.tsx', 'utf8');
  const admin = readFileSync('src/components/admin/AdminDashboard.tsx', 'utf8');

  it('keeps the canonical live pitcher feeds and truthful unavailable state', () => {
    expect(page).toContain('/api/mlb/matchup-matrix/live?date=');
    expect(page).toContain('/api/mlb/matchup-matrix?date=');
    expect(page).toContain('PitcherMatchupDrawer');
    expect(page).toContain('unavailable fields stay unavailable');
  });

  it('adds sourced pitcher arsenal, recent-start, and opponent-batter telemetry', () => {
    expect(service).toContain('getPitchMixMapResult');
    expect(service).toContain('pitchMix,');
    expect(drawer).toContain('PitchMixTable');
    expect(drawer).toContain('Strike%');
    expect(drawer).toContain('Pitches/IP');
    expect(drawer).toContain('Season OPS');
    expect(drawer).toContain('Hard-hit%');
    expect(drawer).toContain('No repertoire is inferred');
  });

  it('uses the HR Next command-desk surface language', () => {
    expect(page).toContain("import '../../features/hr-next/hr-next.css'");
    expect(page).toContain('pitcher-truth-desk ve-page-shell');
    expect(page).toContain('Pitcher Truth Desk');
    expect(css).toContain('border-radius: 0 !important');
    expect(css).toContain('overflow-wrap: break-word');
  });

  it('gates every pitcher-page route alias and its sidebar entry to admins', () => {
    const routeBlock = router.slice(
      router.indexOf("case 'pitcher_matchup':"),
      router.indexOf("case 'hitter_matchup':"),
    );

    expect(routeBlock.match(/<AdminAccessGateShell>/g)).toHaveLength(2);
    expect(routeBlock).not.toContain('<ProGateShell');
    expect(features).toContain('id: "team_matchup_lab"');
    expect(features).toContain('label: "Pitcher Truth Desk"');
    expect(features).toMatch(/id: "team_matchup_lab"[^\n]+access: "admin"/);
  });

  it('links the Admin overview directly to the Pitcher Truth Desk', () => {
    expect(admin).toContain("navigateToSection('team_matchup_lab')");
    expect(admin).toContain('Pitcher Truth Desk');
  });

  it('restores Hitter Zones as the second admin-only Truth Desk option', () => {
    expect(page).toContain('aria-label="Matchup truth surfaces"');
    expect(page).toContain('Pitcher Truth');
    expect(page).toContain('Hitter Zones');
    expect(page).toContain("onNavigate('hitter_matchup_zones')");

    const hitterRoute = router.slice(
      router.indexOf("case 'hitter_matchup':"),
      router.indexOf("case 'pro_graphs_lab':"),
    );
    expect(hitterRoute).toContain('<AdminAccessGateShell>');
    expect(hitterRoute).not.toContain('<ProGateShell');
    expect(features).toMatch(/id: "hitter_matchup_zones"[^\n]+access: "admin"/);
  });
});
