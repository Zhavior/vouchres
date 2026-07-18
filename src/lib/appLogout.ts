import { supabase } from './supabaseClient';

export function resetToLandingScreen() {
  localStorage.removeItem('vouchedge_after_auth_destination');
  localStorage.removeItem('vouchedge_after_auth_mode');
  localStorage.setItem('vouchedge_active_section', 'vouchedge_intro');
  localStorage.setItem('activeSection', 'vouchedge_intro');
  localStorage.setItem('selectedSection', 'vouchedge_intro');
  sessionStorage.removeItem('vouchedge_active_section');
}

export function clearVouchEdgeLocalAuth() {
  localStorage.removeItem('vouchedge_auth_token');
  localStorage.removeItem('mlb_ai_auth_token');
  localStorage.removeItem('vouchedge.auth');
  localStorage.removeItem('vouchedge_after_auth_destination');
  localStorage.removeItem('vouchedge_after_auth_mode');

  Object.keys(localStorage).forEach((key) => {
    const lower = key.toLowerCase();
    if (
      key === 'vouchedge.auth' ||
      (key.startsWith('sb-') && key.includes('auth-token')) ||
      lower.includes('demo') ||
      lower.includes('fake') ||
      lower.includes('mock') ||
      lower.includes('guest') ||
      lower.includes('vouchedge_auth') ||
      lower.includes('mlb_ai_auth')
    ) {
      localStorage.removeItem(key);
    }
  });
}

export async function performAppLogout(onLogoutComplete?: () => void) {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } finally {
    clearVouchEdgeLocalAuth();
    resetToLandingScreen();
    window.history.replaceState(null, '', '/');
    void import('./authSessionSync').then(({ notifyAuthSessionChanged }) => {
      notifyAuthSessionChanged();
    });
    onLogoutComplete?.();
  }
}
