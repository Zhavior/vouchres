// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VEButton } from '../src/components/ui/ve/VEButton';
import { VECard } from '../src/components/ui/ve/VECard';

describe('VE component smoke', () => {
  it('renders VEButton with primary variant classes', () => {
    render(<VEButton>Launch board</VEButton>);
    const button = screen.getByRole('button', { name: 'Launch board' });
    expect(button.className).toContain('ve-button-primary');
  });

  it('renders VECard shell with child content', () => {
    render(
      <VECard strong>
        <p>Trust-first HR research</p>
      </VECard>,
    );

    expect(screen.getByText('Trust-first HR research')).toBeTruthy();
  });
});
