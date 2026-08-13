// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChunkRecoveryFallback } from '../src/components/system/ChunkRecoveryFallback';

describe('ChunkRecoveryFallback', () => {
  it('renders themed recovery copy and reload action', () => {
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

    render(<ChunkRecoveryFallback />);

    expect(screen.getByRole('heading', { name: /we couldn't finish loading this page/i })).toBeTruthy();
    expect(screen.getByText(/refresh to load the latest version/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /refresh vouchres/i })).toBeTruthy();

    reloadSpy.mockRestore();
  });
});
