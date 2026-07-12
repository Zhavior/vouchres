// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VEButton } from '../src/components/ui/ve/VEButton';
import { VEBadge } from '../src/components/ui/ve/VEBadge';
import { VEState } from '../src/components/ui/ve/VEState';

describe('VE component variants', () => {
  it('renders ghost and danger VEButton variants', () => {
    render(
      <>
        <VEButton variant="ghost">Ghost</VEButton>
        <VEButton variant="danger">Danger</VEButton>
      </>,
    );
    expect(screen.getByText('Ghost')).toBeTruthy();
    expect(screen.getByText('Danger')).toBeTruthy();
  });

  it('accepts legacy tone prop on VEBadge without crashing', () => {
    render(<VEBadge tone="cyan">Live</VEBadge>);
    expect(screen.getByText('Live')).toBeTruthy();
  });

  it('renders optional icon on VEState', () => {
    render(
      <VEState title="Empty" description="Nothing here" icon={<span data-testid="state-icon">!</span>} />,
    );
    expect(screen.getByText('Empty')).toBeTruthy();
    expect(screen.getByTestId('state-icon')).toBeTruthy();
  });
});
