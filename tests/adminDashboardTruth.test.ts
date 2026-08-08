import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboardPath = resolve(__dirname, '../src/components/admin/AdminDashboard.tsx');
const shellPath = resolve(__dirname, '../src/features/admin/AuroraHqShell.tsx');

describe('admin dashboard truthfulness', () => {
  it('only exposes backend-backed operations and removes fabricated dashboard claims', () => {
    const dashboard = readFileSync(dashboardPath, 'utf8');
    const shell = readFileSync(shellPath, 'utf8');

    for (const endpoint of [
      '/api/admin/stats',
      '/api/admin/beta',
      '/api/admin/users',
      '/api/admin/cappers',
      '/api/admin/grade-pending',
      '/api/health/backend',
    ]) {
      expect(dashboard).toContain(endpoint);
    }

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
});
