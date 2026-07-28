import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('Aurora password recovery contract', () => {
  it('keeps email/password and Google sign-in together with a forgot-password action', () => {
    const modal = read('src/components/auth/AuthModal.tsx');
    expect(modal).toContain('signInWithEmail');
    expect(modal).toContain('signInWithGoogle');
    expect(modal).toContain('Forgot password?');
    expect(modal).toContain('requestPasswordReset');
  });

  it('uses a dedicated allow-listed recovery route and authenticated password update', () => {
    const client = read('src/lib/supabaseClient.ts');
    const app = read('src/App.tsx');
    const page = read('src/pages/ResetPasswordPage.tsx');
    expect(client).toContain('resetPasswordForEmail');
    expect(client).toContain('/auth/reset-password');
    expect(client).toContain('updateUser({ password })');
    expect(app).toContain("'/auth/reset-password'");
    expect(page).toContain("event === 'PASSWORD_RECOVERY'");
  });
});
