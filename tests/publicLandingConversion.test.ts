// @vitest-environment happy-dom
import React from 'react';
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Hero from '../src/components/landing-v4/Hero';

vi.mock('../src/hooks/public/useLandingTelemetry', () => ({
  useLandingTelemetry: () => ({
    mode: 'offline', isLoading: false, slateDate: null, nextFirstPitch: null,
    gamesActive: null, lineupsSynced: null, eliteCandidates: null, modelStatus: null,
  }),
}));
vi.mock('../src/components/landing-v4/HeroCommandCarousel', () => ({ default: () => null }));

describe('public landing conversion contract', () => {
  it('offers a working signup link even when the data feed is offline', () => {
    render(React.createElement(Hero));
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Build today's card free/i }).getAttribute('href')).toBe('/join');
    expect(screen.getByRole('link', { name: /See exactly how it works/i }).getAttribute('href')).toBe('/#methodology');
    expect(screen.getByText(/System status:/).textContent).toContain('FEED UNREACHABLE');
  });

  it('mounts V4 publicly and retains the URL-driven authentication surface', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const access = readFileSync('src/pages/VouchEdgeTerminalPage.tsx', 'utf8');
    expect(app).toContain('<VouchEdgeLandingV4');
    expect(access).toContain('<AuthModal');
    expect(access).toContain("path === '/signup' || path === '/join'");
    expect(access).toContain("path === '/login' || path === '/signin'");
    expect(access).not.toContain('<VouchEdgeLandingV3');
  });

  it('retains forced public preview routes', () => {
    const source = readFileSync('src/app/sectionNavigation.ts', 'utf8');
    for (const path of ['/landing', '/vouchedge-preview', '/preview/vouchedge']) {
      expect(source).toContain("'" + path + "'");
    }
  });
});
