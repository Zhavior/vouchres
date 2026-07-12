// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChunkRecoveryFallback } from '../src/components/system/ChunkRecoveryFallback';

describe('ChunkRecoveryFallback', () => {
  it('renders themed recovery copy and reload action', () => {
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

    render(<ChunkRecoveryFallback />);

    expect(screen.getByRole('heading', { name: /new version available/i })).toBeTruthy();
    expect(screen.getByText(/could not load the latest app bundle/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /reload vouchedge/i })).toBeTruthy();

    reloadSpy.mockRestore();
  });
});
