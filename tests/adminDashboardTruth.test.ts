import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboardPath = resolve(__dirname, '../src/components/admin/AdminDashboard.tsx');
const shellPath = resolve(__dirname, '../src/features/admin/AuroraHqShell.tsx');
const auroraMaxPath = resolve(__dirname, '../src/components/admin/AuroraMax.tsx');

describe('admin dashboard truthfulness', () => {
  it('only exposes backend-backed operations and removes fabricated dashboard claims', () => {
    const dashboard = readFileSync(dashboardPath, 'utf8');
    const shell = readFileSync(shellPath, 'utf8');

    expect(shell).toContain('Aurora HQ');
    expect(shell).toContain('VouchEdge Admin Command Center');
    expect(dashboard).toContain("label: 'Billing'");
    expect(dashboard).toContain("label: 'Users & Roles'");
    expect(dashboard).toContain('Backend-derived subscription counts');

    for (const endpoint of [
      '/api/admin/stats',
      '/api/admin/beta',
      '/api/admin/users',
      '/api/admin/cappers',
      '/api/admin/grade-pending',
      '/api/admin/hr-research',
      '/api/health/backend',
    ]) {
      expect(dashboard).toContain(endpoint);
    }

    expect(dashboard).toContain("label: 'HR Research Lab'");
    expect(dashboard).toContain('Staff only · no public impact');

    for (const claim of [
      'Live Users',
      "Today's Revenue",
      'AI Spend (24h)',
      'High AI Latency',
      'Failed payment webhooks',
      'MFA Enforcement',
      'GDPR / CCPA Status',
      'Retention Cohorts',
      'Recent Transactions',
      'Module stub',
    ]) {
      expect(dashboard).not.toContain(claim);
      expect(shell).not.toContain(claim);
    }

    expect(existsSync(resolve(__dirname, '../src/features/admin/privacy/AuroraTrustEngine.ts'))).toBe(false);
  });

  it('hosts the Aurora Max reference system inside Aurora HQ', () => {
    const dashboard = readFileSync(dashboardPath, 'utf8');
    const lab = readFileSync(auroraMaxPath, 'utf8');

    expect(dashboard).toContain("label: 'Aurora Max'");
    expect(dashboard).toContain("const AuroraMax = lazy(() => import('./AuroraMax'))");
    expect(lab).toContain('Canonical product system');
    expect(lab).toContain('Aurora Max — Field Desk System');
    expect(lab).toContain('shared visual direction for VouchEdge pages');
    expect(lab).toContain("previewWidth === 'mobile'");
    expect(lab).toContain('Confirmed only');
    expect(lab).toContain('Export receipts');
    expect(lab).toContain('Daily slate');
    expect(lab).toContain('setReceiptId(id)');
    expect(lab).toContain('useState(true)');
    expect(lab).toContain('useState<string | null>(null)');
    expect(lab).not.toContain('Free open beta');
    expect(lab).not.toContain('Log in');
    expect(lab).not.toContain('savedOnly');
  });
});
