// @vitest-environment happy-dom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ParlayOsStatusBadge } from '../src/components/parlay/hub/parlayOsUi';

describe('ParlayOsStatusBadge', () => {
  it('renders the slip-specific ready-to-grade state', () => {
    render(<ParlayOsStatusBadge status="ready_to_grade" />);

    expect(screen.getByText('Ready to grade')).toBeTruthy();
  });

  it('still renders leg-only in-progress metadata', () => {
    render(<ParlayOsStatusBadge status="in_progress" />);

    expect(screen.getByText('Live')).toBeTruthy();
  });
});
