// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import VouchEdgeBootScreen from '../src/components/boot/VouchEdgeBootScreen';
import HelloScreen from '../src/components/auth/HelloScreen';
import { VouchEdgeMark } from '../src/brand/VouchEdgeMark';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('VouchEdge splash + brand mark', () => {
  it('renders an HD SVG brand mark', () => {
    const { container } = render(<VouchEdgeMark size={96} variant="boot" />);
    const svg = container.querySelector('svg.ve-brand-mark');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 1024 1024');
    expect(svg?.className.baseVal || svg?.getAttribute('class')).toContain('ve-mark-boot');
  });

  it('shows a logo-first boot splash with progress', () => {
    render(
      <VouchEdgeBootScreen
        boot={{
          ready: false,
          progress: 42,
          status: 'Warming HR board',
          activeFeature: 'HR Board',
          completed: 2,
          total: 5,
          requiredDone: false,
          timedOut: false,
          jobs: {},
        }}
      />,
    );
    const splash = screen.getByLabelText('Loading VouchEdge');
    expect(splash).toBeTruthy();
    expect(splash.querySelector('svg.ve-brand-mark')).toBeTruthy();
    expect(screen.getByText('42%')).toBeTruthy();
    expect(screen.getByText(/Warming HR board/i)).toBeTruthy();
  });

  it('shows a login Hello splash', () => {
    render(<HelloScreen />);
    const splash = screen.getByLabelText('Signing in');
    expect(splash).toBeTruthy();
    expect(splash.querySelector('svg.ve-brand-mark')).toBeTruthy();
    expect(screen.getByText(/Welcome back/i)).toBeTruthy();
  });

  it('keeps BootGate wired to render the splash while booting', () => {
    const gate = readFileSync(resolve(process.cwd(), 'src/components/boot/VouchEdgeBootGate.tsx'), 'utf8');
    expect(gate).toContain('VouchEdgeBootScreen');
    expect(gate).toContain('shouldRunBoot && !boot.ready');
  });

  it('ships a master SVG with trust shield + VE letters', () => {
    const svg = readFileSync(resolve(process.cwd(), 'public/brand/vouchedge-mark.svg'), 'utf8');
    expect(svg).toContain('viewBox="0 0 1024 1024"');
    expect(svg).toContain('#020617');
    expect(svg).toContain('#00E5FF');
    expect(svg).toContain('ve-mark-letters');
    expect(svg).toContain('letter-v');
    expect(svg).toContain('letter-e');
  });

  it('exports a 4K PNG master for store / press', () => {
    const png = readFileSync(resolve(process.cwd(), 'public/brand/vouchedge-4k.png'));
    expect(png.length).toBeGreaterThan(50_000);
    // PNG IHDR width/height at bytes 16–23 are big-endian 4096
    expect(png.readUInt32BE(16)).toBe(4096);
    expect(png.readUInt32BE(20)).toBe(4096);
  });
});
