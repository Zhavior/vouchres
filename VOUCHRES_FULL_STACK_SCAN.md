# Vouchres / VouchEdge Full Stack Scan

Generated: Mon 29 Jun 2026 20:13:55 ADT

## 1. Git Status
```txt
 M src/App.tsx
 M src/components/auth/AuthStatusBadge.tsx
?? SCAN_VOUCHRES_APP.sh
?? VOUCHRES_FULL_STACK_SCAN.md
```

## 2. Build Check
```txt

> vouchedge@0.0.0 build
> vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs && esbuild server/cron/dailyGradeJob.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/gradeJob.cjs && esbuild server/cron/dailyDeleteJob.ts --bundle --platform=node --format=cjs --packages=external --external:stripe --external:../middleware/auth --outfile=dist/deleteJob.cjs

vite v6.4.3 building for production...
transforming...
Found 2 warnings while optimizing generated CSS:

Issue #1:
[2m│   position: absolute;[22m
[2m│ }[22m
[2m│[22m .has-active-theme .premium-card-bg, .has-active-theme [id^="panel-"], .has-active-theme [class*="bg-[#121824]"], .has-active-theme [class*="bg-[#0e1320]"], .has-active-theme [class*="bg-[#090d16]"], .has-active-theme .bg-slate-900:not(#brand-logo-id), .has-active-theme .bg-slate-950, .has-active-theme .bg-[#121824]\/30 {
[2m┆[22m                                                                                                                                                                                                                                                                                                                     [33m[2m^--[22m No qualified name in attribute selector: Hash("121824").[39m
[2m┆[22m
[2m│   background-color: var(--theme-card-bg-fallback, rgba(14, 18, 28, 0.65)) !important;[22m
[2m│   border-color: var(--theme-border-color) !important;[22m

Issue #2:
[2m│   box-shadow: 0 4px 20px -2px var(--theme-shadow-glow) !important;[22m
[2m│ }[22m
[2m│[22m .has-active-theme .border-slate-850, .has-active-theme .border-slate-900, .has-active-theme .border-[#3b82f6]\/10, .has-active-theme .border-[#1e293b]\/50 {
[2m┆[22m                                                                                                      [33m[2m^--[22m No qualified name in attribute selector: Hash("3b82f6").[39m
[2m┆[22m
[2m│   border-color: var(--theme-border-color) !important;[22m
[2m│ }[22m

✓ 2796 modules transformed.
[plugin vite:reporter] 
(!) /Users/boydsantos/Desktop/vouchres/src/lib/supabaseClient.ts is dynamically imported by /Users/boydsantos/Desktop/vouchres/src/lib/apiClient.ts but also statically imported by /Users/boydsantos/Desktop/vouchres/src/App.tsx, /Users/boydsantos/Desktop/vouchres/src/components/auth/AuthStatusBadge.tsx, /Users/boydsantos/Desktop/vouchres/src/components/theEdge/TheEdgeShell.tsx, /Users/boydsantos/Desktop/vouchres/src/lib/apiClient.ts, dynamic import will not move module into another chunk.

rendering chunks...
computing gzip size...
dist/index.html                     0.42 kB │ gzip:   0.30 kB
dist/assets/index-DGLDDhwg.css    530.06 kB │ gzip:  56.05 kB
dist/assets/index-CfXiAJx2.js   2,005.88 kB │ gzip: 533.97 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 3.72s

  dist/server.cjs      354.5kb
  dist/server.cjs.map  711.1kb

⚡ Done in 14ms

  dist/gradeJob.cjs  15.5kb

⚡ Done in 2ms

  dist/deleteJob.cjs  13.3kb

⚡ Done in 3ms
```

## 3. Biggest Frontend Files
```txt
```

## 4. Route/Auth Logic in App.tsx
```txt
99:const STICKY_PUBLIC_SECTIONS = new Set([
100:  'welcome',
110:const PUBLIC_SECTIONS = new Set([
111:  'welcome',
124:function hasRealAuthToken() {
157:const PROTECTED_SECTIONS = new Set([
170:function requiresLogin(section: string) {
171:  if (PUBLIC_SECTIONS.has(section)) return false;
172:  return PROTECTED_SECTIONS.has(section);
219:  const [activeSection, setActiveSection] = useState<string>(() => {
222:    if (DEV_BYPASS_AUTH && hasRealAuthToken()) return 'hr_board';
223:    return 'welcome';
225:  const activeSectionRef = useRef(activeSection);
235:  const navigateSection = (section: string) => {
236:    if (PUBLIC_SECTIONS.has(section)) {
238:      setActiveSection(section);
242:    if (requiresLogin(section) && !hasRealAuthToken()) {
249:      saveActiveSection('welcome');
250:      setActiveSection('welcome');
255:    setActiveSection(section);
259:    activeSectionRef.current = activeSection;
260:  }, [activeSection]);
276:        navigateSection(locationSection);
308:    if (activeSection === 'themestore' && !canSeeThemeStore) {
309:      setActiveSection('profile');
311:  }, [activeSection, canSeeThemeStore]);
807:    navigateSection('live_parlays');
851:    if (activeSection === 'results') handleGradeResults();
853:  }, [activeSection]);
1000:    switch (activeSection) {
1001:      case 'welcome':
1006:            activeSection={activeSection}
1009:            onSectionChange={navigateSection}
1013:        return <TodayDashboard onSectionChange={navigateSection} savedSlips={savedSlips} />;
1028:            onSectionChange={navigateSection}
1038:            onSectionChange={navigateSection}
1049:            onSectionChange={navigateSection}
1058:        return <MlbIntelligenceHub profile={profile} onSectionChange={navigateSection} />;
1068:          <ProAccessGate profile={profile} featureName="Live Game Lab" onNavigatePremium={() => navigateSection('premium')}>
1074:          <ProAccessGate profile={profile} featureName="Player Edge Lab" onNavigatePremium={() => navigateSection('premium')}>
1080:          <ProAccessGate profile={profile} featureName="Team Matchup Lab" onNavigatePremium={() => navigateSection('premium')}>
1086:          <ProAccessGate profile={profile} featureName="Pro Graphs Lab" onNavigatePremium={() => navigateSection('premium')}>
1093:            onSectionChange={navigateSection}
1120:            onSectionChange={navigateSection}
1184:            onNavigatePremium={() => navigateSection('premium')}
1189:              onSectionChange={navigateSection}
1207:            onSectionChange={navigateSection}
1221:      <AppErrorBoundary resetKey={activeSection} onBackHome={() => navigateSection('today')}>
1223:          activeSection={activeSection}
1224:          onSectionChange={navigateSection}
1234:          {activeSection !== 'welcome' && <HrNotifications savedSlips={savedSlips} />}
1235:          {activeSection !== 'welcome' && <AppNotificationsHost onNavigate={navigateSection} />}
```

## 5. The Edge / The Island Routing
```txt
src/components/theEdge/EdgeValueDeck.tsx:23:      ['The Edge dashboard', true],
src/components/theEdge/EdgeValueDeck.tsx:92:              The Edge is not just a homepage. It is the product lobby: users see value first, then choose where to enter.
src/components/theEdge/EdgeValueDeck.tsx:184:        Members should not feel trapped in The Edge. They should see a clear next action and enter the right part of the site.
src/components/theEdge/EdgeSignatureDeck.tsx:16:  mode: 'public' | 'dashboard';
src/components/theEdge/EdgeSignatureDeck.tsx:46:  const isDashboard = mode === 'dashboard';
src/components/theEdge/EdgeSignatureDeck.tsx:62:            {isDashboard ? 'The Island' : 'The Edge Difference'}
src/components/theEdge/EdgeSignatureDeck.tsx:81:              : 'Most apps throw users into charts. The Edge sells the product first, explains the value, then transforms into the member dashboard when the user is ready.'}
src/components/theEdge/TheEdgeShell.tsx:10:type TheEdgeMode = 'public' | 'dashboard';
src/components/theEdge/TheEdgeShell.tsx:14:type EdgeLayer = 'intro' | 'login' | 'signup' | 'welcomeBack' | 'dashboard';
src/components/theEdge/TheEdgeShell.tsx:77:  onSectionChange: (section: string) => void;
src/components/theEdge/TheEdgeShell.tsx:158:  onSectionChange,
src/components/theEdge/TheEdgeShell.tsx:160:  const [edgeLayer, setEdgeLayer] = useState<EdgeLayer>(mode === 'public' ? 'intro' : 'welcomeBack');
src/components/theEdge/TheEdgeShell.tsx:161:  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryResponse | null>(null);
src/components/theEdge/TheEdgeShell.tsx:162:  const [dashboardSummaryLoading, setDashboardSummaryLoading] = useState(false);
src/components/theEdge/TheEdgeShell.tsx:219:    if (mode === 'dashboard') {
src/components/theEdge/TheEdgeShell.tsx:220:      setEdgeLayer('welcomeBack');
src/components/theEdge/TheEdgeShell.tsx:221:      const t = window.setTimeout(() => setEdgeLayer('dashboard'), 900);
src/components/theEdge/TheEdgeShell.tsx:237:  }, [savedParlays, profile, slate, dashboardSummary]);
src/components/theEdge/TheEdgeShell.tsx:240:    if (edgeLayer !== 'dashboard' && edgeLayer !== 'welcomeBack') return;
src/components/theEdge/TheEdgeShell.tsx:254:        const response = await fetch('/api/me/dashboard-summary', {
src/components/theEdge/TheEdgeShell.tsx:283:  function enterSite(section = 'feed') {
src/components/theEdge/TheEdgeShell.tsx:284:    onSectionChange(section);
src/components/theEdge/TheEdgeShell.tsx:292:    setEdgeLayer('welcomeBack');
src/components/theEdge/TheEdgeShell.tsx:293:    window.setTimeout(() => setEdgeLayer('dashboard'), 900);
src/components/theEdge/TheEdgeShell.tsx:434:              · {edgeLayer === 'dashboard' || edgeLayer === 'welcomeBack' ? 'The Island' : 'MLB Proof Engine'}
src/components/theEdge/TheEdgeShell.tsx:444:            {(edgeLayer === 'dashboard' || edgeLayer === 'welcomeBack') && (
src/components/theEdge/TheEdgeShell.tsx:445:              <button onClick={() => enterSite('feed')} className="rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5">
src/components/theEdge/TheEdgeShell.tsx:500:                      <button onClick={() => enterSite('feed')} className={GHOST}>Explore site</button>
src/components/theEdge/TheEdgeShell.tsx:598:                  <p className="mt-2 text-sm leading-6 text-slate-400">Login happens right here — then The Edge becomes your Island.</p>
src/components/theEdge/TheEdgeShell.tsx:628:                    {authBusy ? 'Logging in...' : 'Login → Enter The Island'}
src/components/theEdge/TheEdgeShell.tsx:876:            {edgeLayer === 'welcomeBack' && (
src/components/theEdge/TheEdgeShell.tsx:878:                key="welcomeBack"
src/components/theEdge/TheEdgeShell.tsx:895:                <p className="mt-3 text-sm text-slate-400">Building your Island dashboard…</p>
src/components/theEdge/TheEdgeShell.tsx:900:            {edgeLayer === 'dashboard' && (
src/components/theEdge/TheEdgeShell.tsx:902:                key="dashboard"
src/components/theEdge/TheEdgeShell.tsx:912:                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">The Island</div>
src/components/theEdge/TheEdgeShell.tsx:918:                    <button onClick={() => enterSite('feed')} className={PRIMARY}>
src/components/theEdge/TheEdgeShell.tsx:925:                    <Stat label="Saved picks" value={dashboardSummaryLoading ? '...' : stats.savedPicks} tone="cyan" />
src/components/theEdge/TheEdgeShell.tsx:926:                    <Stat label="Saved parlays" value={dashboardSummaryLoading ? '...' : stats.saved} tone="cyan" />
src/components/theEdge/TheEdgeShell.tsx:927:                    <Stat label="Pending" value={dashboardSummaryLoading ? '...' : stats.pending} tone="white" />
src/components/theEdge/TheEdgeShell.tsx:929:                    <Stat label="Proof score" value={dashboardSummaryLoading ? '...' : stats.proofScore} tone="violet" />
src/components/theEdge/TheEdgeShell.tsx:944:                      onClick={() => enterSite(section)}
src/components/theEdge/TheEdgeShell.tsx:961:                        <button key={p.id} onClick={() => enterSite('live_parlays')} className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-left hover:border-cyan-300/30">
src/components/theEdge/TheEdgeShell.tsx:967:                        <button onClick={() => enterSite('ai_engine')} className="w-full rounded-xl border border-dashed border-slate-700 bg-slate-900/30 px-3 py-4 text-center text-xs font-bold text-slate-500 hover:text-slate-300">
src/components/theEdge/TheEdgeShell.tsx:978:                        <button key={tool} onClick={() => enterSite('ai_engine')} className="rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-left text-xs font-bold text-slate-200 hover:border-cyan-300/30">
src/components/theEdge/TheEdgeShell.tsx:983:                    <button onClick={() => enterSite('themestore')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200">
src/components/theEdge/EdgeCodeWelcome.tsx:21:  "const edge = createPortal('The Edge');",
src/components/theEdge/EdgeCodeWelcome.tsx:23:  "edge.auth.login(() => transform('The Island'));",
src/components/theEdge/EdgeCodeWelcome.tsx:25:  "edge.dashboard.mount(['alerts', 'todayBoard', 'ledger']);",
src/components/theEdge/EdgeCodeWelcome.tsx:49:            The Edge is your{' '}
src/components/theEdge/EdgeCodeWelcome.tsx:55:            then the welcome layer transforms into The Island dashboard.
src/components/theEdge/EdgeCodeWelcome.tsx:137:              After login: Welcome Portal → The Island
src/components/theEdge/EdgeCodeWelcome.tsx:140:              The user stays inside The Edge until they choose to enter the full VouchEdge site.
src/components/theEdge/TheEdgeOverlay.tsx:6:  onSectionChange: (section: string) => void;
src/components/theEdge/TheEdgeOverlay.tsx:11:  onSectionChange,
src/components/theEdge/TheEdgeOverlay.tsx:17:      onSectionChange('feed');
src/components/theEdge/TheEdgeOverlay.tsx:21:    onSectionChange('welcome');
src/components/theEdge/TheEdgeOverlay.tsx:45:          <span className="relative">{isOnTheEdge ? 'Home' : 'The Edge'}</span>
src/social/feed/FeedMobileNav.tsx:8:  onSectionChange: (section: string) => void;
src/social/feed/FeedMobileNav.tsx:12:export default function FeedMobileNav({ activeSection, onSectionChange, profile }: FeedMobileNavProps) {
src/social/feed/FeedMobileNav.tsx:42:            onClick={() => onSectionChange(item.id)}
src/social/feed/FeedSidebar.tsx:9:/** Sidebar section order. Ungrouped items (e.g. The Edge) render first, headerless. */
src/social/feed/FeedSidebar.tsx:21:  onSectionChange: (section: string) => void;
src/social/feed/FeedSidebar.tsx:25:export default function FeedSidebar({ activeSection, onSectionChange, profile }: FeedSidebarProps) {
src/social/feed/FeedSidebar.tsx:63:        onClick={() => onSectionChange(f.id)}
src/social/feed/FeedSidebar.tsx:110:          onClick={() => onSectionChange('feed')}
src/social/feed/FeedSidebar.tsx:163:          {/* Ungrouped (e.g. The Edge) */}
src/social/feed/FeedSidebar.tsx:183:            onClick={() => onSectionChange('build')}
src/social/feed/FeedSidebar.tsx:195:        onClick={() => onSectionChange('profile')}
src/social/feed/FeedSidebar.tsx:232:          onClick={() => onSectionChange("customize")}
src/social/feed/HomeFeedLayout.tsx:16:  onSectionChange: (section: string) => void;
src/social/feed/HomeFeedLayout.tsx:29:  onSectionChange,
src/social/feed/HomeFeedLayout.tsx:151:            onSectionChange={onSectionChange} 
src/social/feed/HomeFeedLayout.tsx:161:              <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSectionChange('feed')}>
src/social/feed/HomeFeedLayout.tsx:173:                  onClick={() => onSectionChange('premium')}
src/social/feed/HomeFeedLayout.tsx:181:                  onClick={() => onSectionChange('profile')}
src/social/feed/HomeFeedLayout.tsx:227:            onSectionChange={onSectionChange}
src/social/feed/HomeFeedLayout.tsx:232:            onSectionChange={onSectionChange}
src/social/feed/HomeFeedLayout.tsx:244:        onSectionChange={onSectionChange} 
src/social/feed/HomeFeedPage.tsx:35:  onSectionChange?: (section: string) => void;
src/social/feed/HomeFeedPage.tsx:50:  onSectionChange,
src/social/feed/HomeFeedPage.tsx:368:            if (onSectionChange) onSectionChange('premium');
src/App.tsx:235:  const navigateSection = (section: string) => {
src/App.tsx:276:        navigateSection(locationSection);
src/App.tsx:298:  // The Edge route mode:
src/App.tsx:300:  // logged-in/dev users see the personalized My Edge dashboard.
src/App.tsx:807:    navigateSection('live_parlays');
src/App.tsx:1004:            mode={isOpenEdgeDashboardMode ? 'dashboard' : 'public'}
src/App.tsx:1009:            onSectionChange={navigateSection}
src/App.tsx:1013:        return <TodayDashboard onSectionChange={navigateSection} savedSlips={savedSlips} />;
src/App.tsx:1028:            onSectionChange={navigateSection}
src/App.tsx:1038:            onSectionChange={navigateSection}
src/App.tsx:1049:            onSectionChange={navigateSection}
src/App.tsx:1058:        return <MlbIntelligenceHub profile={profile} onSectionChange={navigateSection} />;
src/App.tsx:1068:          <ProAccessGate profile={profile} featureName="Live Game Lab" onNavigatePremium={() => navigateSection('premium')}>
src/App.tsx:1074:          <ProAccessGate profile={profile} featureName="Player Edge Lab" onNavigatePremium={() => navigateSection('premium')}>
src/App.tsx:1080:          <ProAccessGate profile={profile} featureName="Team Matchup Lab" onNavigatePremium={() => navigateSection('premium')}>
src/App.tsx:1086:          <ProAccessGate profile={profile} featureName="Pro Graphs Lab" onNavigatePremium={() => navigateSection('premium')}>
src/App.tsx:1093:            onSectionChange={navigateSection}
src/App.tsx:1120:            onSectionChange={navigateSection}
src/App.tsx:1184:            onNavigatePremium={() => navigateSection('premium')}
src/App.tsx:1189:              onSectionChange={navigateSection}
src/App.tsx:1207:            onSectionChange={navigateSection}
src/App.tsx:1221:      <AppErrorBoundary resetKey={activeSection} onBackHome={() => navigateSection('today')}>
src/App.tsx:1224:          onSectionChange={navigateSection}
src/App.tsx:1235:          {activeSection !== 'welcome' && <AppNotificationsHost onNavigate={navigateSection} />}
```

## 6. Auth Badge / Supabase Session Logic
```txt
import { useEffect, useState } from 'react';
import { LogOut, ShieldCheck, UserCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

function resetToLandingScreen() {
  resetToLandingScreen();
  localStorage.removeItem('vouchedge_after_auth_destination');
  localStorage.removeItem('activeSection');
  localStorage.removeItem('selectedSection');
  sessionStorage.removeItem('vouchedge_active_section');
}

function clearVouchEdgeLocalAuth() {
  localStorage.removeItem('vouchedge_auth_token');
  localStorage.removeItem('mlb_ai_auth_token');
  localStorage.removeItem('vouchedge_after_auth_destination');

  // remove old/demo/local auth-ish keys without deleting everything
  Object.keys(localStorage).forEach((key) => {
    const lower = key.toLowerCase();
    if (
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

export default function AuthStatusBadge() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let alive = true;

    async function verifyRealUser() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        clearVouchEdgeLocalAuth();
        if (alive) {
          setEmail(null);
          setChecking(false);
        }
        return;
      }

      const { data: userData, error } = await supabase.auth.getUser();

      if (!alive) return;

      if (error || !userData.user) {
        clearVouchEdgeLocalAuth();
        setEmail(null);
      } else {
        localStorage.setItem('vouchedge_auth_token', sessionData.session.access_token);
        setEmail(userData.user.email ?? 'Account');
      }

      setChecking(false);
    }

    verifyRealUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        clearVouchEdgeLocalAuth();
        setEmail(null);
        setChecking(false);
        return;
      }

      localStorage.setItem('vouchedge_auth_token', session.access_token);
      setEmail(session.user.email ?? 'Account');
      setChecking(false);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    setSigningOut(true);

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      clearVouchEdgeLocalAuth();
      resetToLandingScreen();
      setEmail(null);
      setSigningOut(false);
      window.location.assign('/');
    }
  }

  return (
    <div className="fixed right-4 top-4 z-[99999]">
      <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/95 px-3 py-2 text-xs font-black text-white shadow-2xl backdrop-blur">
        {checking ? (
          <span>Checking login...</span>
        ) : email ? (
          <>
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span className="hidden max-w-[180px] truncate sm:inline">Logged in: {email}</span>
            <span className="sm:hidden">Logged in</span>
            <button
              type="button"
              onClick={logout}
              disabled={signingOut}
              className="ml-1 inline-flex items-center gap-1 rounded-full border border-red-300/30 bg-red-500/20 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-red-100 hover:bg-red-500/30 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {signingOut ? 'Leaving' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            <UserCircle className="h-4 w-4 text-slate-300" />
            <span>Guest mode</span>
          </>
        )}
      </div>
    </div>
  );
}

src/App.tsx:143:          localStorage.setItem('vouchedge_auth_token', accessToken);
src/App.tsx:303:    Boolean(localStorage.getItem('vouchedge_auth_token')) ||
src/App.tsx:304:    Boolean(localStorage.getItem('mlb_ai_auth_token')) ||
src/components/LiveStreams.tsx:455:        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
src/components/auth/AuthStatusBadge.tsx:14:  localStorage.removeItem('vouchedge_auth_token');
src/components/auth/AuthStatusBadge.tsx:15:  localStorage.removeItem('mlb_ai_auth_token');
src/components/auth/AuthStatusBadge.tsx:43:      const { data: sessionData } = await supabase.auth.getSession();
src/components/auth/AuthStatusBadge.tsx:54:      const { data: userData, error } = await supabase.auth.getUser();
src/components/auth/AuthStatusBadge.tsx:62:        localStorage.setItem('vouchedge_auth_token', sessionData.session.access_token);
src/components/auth/AuthStatusBadge.tsx:71:    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
src/components/auth/AuthStatusBadge.tsx:79:      localStorage.setItem('vouchedge_auth_token', session.access_token);
src/components/auth/AuthStatusBadge.tsx:94:      await supabase.auth.signOut({ scope: 'local' });
src/components/ResultsPage.tsx:380:        localStorage.getItem('vouchedge_auth_token') ||
src/components/ResultsPage.tsx:381:        localStorage.getItem('mlb_ai_auth_token');
src/components/theEdge/TheEdgeShell.tsx:246:        localStorage.getItem('vouchedge_auth_token') ||
src/components/theEdge/TheEdgeShell.tsx:247:        localStorage.getItem('mlb_ai_auth_token');
src/lib/supabaseClient.ts:48:  const { data } = await supabase.auth.getSession();
src/lib/supabaseClient.ts:99:export async function signOut() {
src/lib/supabaseClient.ts:100:  await supabase.auth.signOut();
src/lib/supabaseClient.ts:106:export function onAuthStateChange(
src/lib/supabaseClient.ts:109:  return supabase.auth.onAuthStateChange((event, session) => {
src/lib/useAuth.ts:4:  onAuthStateChange,
src/lib/useAuth.ts:45: *   const { user, loading, signIn, signOut, refresh } = useAuth();
src/lib/useAuth.ts:88:    const { data } = onAuthStateChange(async (event) => {
src/lib/useAuth.ts:106:  const signOut = useCallback(async () => {
src/lib/useAuth.ts:107:    await supabase.auth.signOut();
src/lib/useAuth.ts:116:    signOut,
src/lib/apiClient.ts:65:    await supabase.auth.signOut();
```

## 7. Fake/Demo/Local Data Scan
```txt
src/App.tsx:37:import { INITIAL_PROFILE, INITIAL_POSTS } from './data/mockData';
src/App.tsx:127:    // Do not trust old VouchEdge/demo/local fallback keys.
src/App.tsx:128:    for (let index = 0; index < localStorage.length; index += 1) {
src/App.tsx:129:      const key = localStorage.key(index);
src/App.tsx:133:      const raw = localStorage.getItem(key);
src/App.tsx:143:          localStorage.setItem('vouchedge_auth_token', accessToken);
src/App.tsx:164:    localStorage.setItem('vouchedge_active_section', section);
src/App.tsx:244:        localStorage.setItem('vouchedge_after_auth_destination', section);
src/App.tsx:303:    Boolean(localStorage.getItem('vouchedge_auth_token')) ||
src/App.tsx:304:    Boolean(localStorage.getItem('mlb_ai_auth_token')) ||
src/App.tsx:305:    localStorage.getItem('vouchedge_after_auth_mode') === 'island';
src/App.tsx:417:      const storedPosts = localStorage.getItem('vouchedge_posts');
src/App.tsx:422:        localStorage.setItem('vouchedge_posts', JSON.stringify(INITIAL_POSTS));
src/App.tsx:425:      const storedSlips = localStorage.getItem('vouchedge_slips');
src/App.tsx:432:      const storedVouches = localStorage.getItem('vouchedge_vouches');
src/App.tsx:439:        localStorage.setItem('vouchedge_vouches', JSON.stringify(seeds));
src/App.tsx:442:      const storedProfile = localStorage.getItem('vouchedge_profile');
src/App.tsx:447:        localStorage.setItem('vouchedge_profile', JSON.stringify(INITIAL_PROFILE));
src/App.tsx:459:    localStorage.setItem('vouchedge_posts', JSON.stringify(newPosts));
src/App.tsx:465:    localStorage.setItem('vouchedge_slips', JSON.stringify(newSlips));
src/App.tsx:470:    localStorage.setItem('vouchedge_vouches', JSON.stringify(newVouches));
src/App.tsx:476:    localStorage.setItem('vouchedge_profile', JSON.stringify(newProfile));
src/App.tsx:859:    const lastGen = localStorage.getItem('vouchedge_ai_gen_date');
src/App.tsx:861:    const genTime = localStorage.getItem('vouchedge_ai_gen_time') || AI_GEN_DEFAULT_TIME; // "HH:MM"
src/App.tsx:869:    localStorage.setItem('vouchedge_ai_gen_date', today);
src/App.tsx:886:    localStorage.setItem('vouchedge_ai_gen_date', new Date().toISOString().slice(0, 10));
src/App.tsx:944:    localStorage.removeItem('vouchedge_posts');
src/App.tsx:945:    localStorage.removeItem('vouchedge_slips');
src/App.tsx:946:    localStorage.removeItem('vouchedge_vouches');
src/App.tsx:947:    localStorage.removeItem('vouchedge_profile');
src/App.tsx:955:    localStorage.setItem('vouchedge_posts', JSON.stringify(INITIAL_POSTS));
src/App.tsx:956:    localStorage.setItem('vouchedge_slips', JSON.stringify([]));
src/App.tsx:957:    localStorage.setItem('vouchedge_vouches', JSON.stringify(seeds));
src/App.tsx:958:    localStorage.setItem('vouchedge_profile', JSON.stringify(INITIAL_PROFILE));
src/sports/registry.ts:61:  const stored = localStorage.getItem(STORAGE_KEY) as SportId | null;
src/sports/registry.ts:74:  localStorage.setItem(STORAGE_KEY, id);
src/social/feed/FeedPostCard.tsx:122:      const bookmarks = JSON.parse(localStorage.getItem('vouchedge_bookmarks') || '[]');
src/social/feed/FeedPostCard.tsx:133:      const savedVote = localStorage.getItem(`poll_vote_${post.id}`);
src/social/feed/FeedPostCard.tsx:183:      localStorage.setItem(`poll_vote_${post.id}`, String(idx));
src/social/feed/FeedPostCard.tsx:192:      const bookmarks = JSON.parse(localStorage.getItem('vouchedge_bookmarks') || '[]');
src/social/feed/FeedPostCard.tsx:196:        localStorage.setItem('vouchedge_bookmarks', JSON.stringify(filtered));
src/social/feed/FeedPostCard.tsx:200:        localStorage.setItem('vouchedge_bookmarks', JSON.stringify(bookmarks));
src/social/feed/FeedPostCard.tsx:242:      const stored = localStorage.getItem('vouchedge_following');
src/social/feed/FeedPostCard.tsx:251:      const stored = localStorage.getItem('vouchedge_profile');
src/social/feed/FeedPostCard.tsx:266:        const stored = localStorage.getItem('vouchedge_profile');
src/social/feed/FeedPostCard.tsx:302:    localStorage.setItem('vouchedge_following', JSON.stringify(updated));
src/social/feed/FeedPostCard.tsx:310:      const stored = localStorage.getItem('vouchedge_profile');
src/social/feed/FeedPostCard.tsx:315:        localStorage.setItem('vouchedge_profile', JSON.stringify(parsed));
src/social/feed/FeedPostCard.tsx:324:        localStorage.setItem('vouchedge_following', JSON.stringify(updated));
src/social/feed/FeedPostCard.tsx:441:                placeholder="Post your reply..." 
src/social/feed/FeedPostCard.tsx:444:                className="flex-1 text-xs bg-[#0b0f19] text-white border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-sky-500/80 transition-all font-medium placeholder-slate-500"
src/social/feed/FeedPostCard.tsx:945:                placeholder="Why are you tailing/quoting this? Share your custom verified analysis..."
src/social/feed/FeedPostCard.tsx:949:                className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-sky-500 transition-colors resize-none placeholder-slate-600 font-medium"
src/social/feed/FeedPostCard.tsx:990:              placeholder="Post your reply..." 
src/social/feed/FeedPostCard.tsx:993:              className="flex-1 text-xs bg-[#0b0f19] text-white border border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-sky-500/80 transition-all font-medium placeholder-slate-500"
src/social/feed/HomeFeedPage.tsx:65:    return localStorage.getItem('vEdge_adSponsor') || 'DraftKings';
src/social/feed/HomeFeedPage.tsx:71:      const stored = localStorage.getItem('vouchedge_following');
src/social/feed/HomeFeedPage.tsx:187:              placeholder="Search picks..."
src/social/feed/HomeFeedPage.tsx:190:              className="w-full text-xs bg-[#121824]/60 backdrop-blur-sm text-slate-100 border border-slate-850/50 pl-8 pr-3 py-1.5 rounded-xl focus:border-sky-500/80 outline-none transition-all font-medium placeholder-slate-500"
src/social/feed/HomeFeedPage.tsx:376:            id="empty-following-placeholder-slate"
src/social/feed/HomeFeedPage.tsx:391:            id="empty-feed-placeholder-slate"
src/social/feed/ProofBuildersPanel.tsx:11:  // This features zero fake profiles, only the user's actual transparent track record that builds as they play!
src/social/feed/ProofBuildersPanel.tsx:71:            * Leader statistics update automatically based on actual parlay results and verified grading. No fake or simulated records.
src/social/feed/FeedComposer.tsx:294:            placeholder="Share a parlay, vouch, or research note…"
src/social/feed/FeedComposer.tsx:296:            className="w-full text-sm bg-transparent border-none text-slate-100 placeholder-slate-500 outline-none resize-none pt-1"
src/social/feed/FeedComposer.tsx:310:                  placeholder="e.g. Padres, Glasnow"
src/social/feed/FeedComposer.tsx:320:                  placeholder="e.g. Padres @ Dodgers"
src/social/feed/FeedComposer.tsx:330:                  placeholder="e.g. Glasnow Over 7.5 Ks in 4/5"
src/social/feed/FeedComposer.tsx:398:                    placeholder="Padres @ Dodgers" 
src/social/feed/FeedComposer.tsx:408:                    placeholder="Manny Machado Over 1.5 Hits" 
src/social/feed/FeedComposer.tsx:418:                    placeholder="+140" 
src/social/feed/FeedComposer.tsx:432:                    placeholder="Over" 
src/social/feed/FeedComposer.tsx:442:                    placeholder="1.5" 
src/social/feed/FeedComposer.tsx:470:                    placeholder="Manny Machado" 
src/social/feed/FeedComposer.tsx:495:                    placeholder="Padres slugging heavily against lefties tonight..." 
src/social/feed/FeedComposer.tsx:505:                    placeholder="Provide a deep-dive analysis (e.g. San Diego has won 4/5 matchups with rest advantage, cashing over 1.5 hits in 75% of similar starter matchups)..." 
src/social/feed/FeedComposer.tsx:666:                    placeholder="Manny Machado Over 1.5 Hits — WON" 
src/social/feed/FeedComposer.tsx:676:                    placeholder="Result: 2 Hits (WIN)" 
src/social/feed/FeedComposer.tsx:708:                    placeholder="e.g., Will Shohei Ohtani hit a home run tonight?"
src/social/feed/FeedComposer.tsx:723:                        placeholder={`Option ${idx + 1}`}
src/components/intel/PitcherProfileDrawer.tsx:48:/** A "verified feed required" placeholder — honest, no fabricated analytics. */
src/components/PlayerResearchHub.tsx:329:                  placeholder="Search players, teams, positions..."
src/components/PlayerResearchHub.tsx:332:                  className="w-full rounded-xl py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
src/components/Leaderboard.tsx:194:            placeholder="Search verified cappers, sports, or system badges..."
src/components/Leaderboard.tsx:197:            className="w-full text-xs bg-[#121824] text-slate-100 border border-slate-850 pl-9 pr-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-all placeholder-slate-500 font-semibold"
src/components/LiveStreams.tsx:137:    streamerUsername: 'stream_demo_4',
src/components/LiveStreams.tsx:171:  "This stream is a demo preview",
src/components/LiveStreams.tsx:1280:                        placeholder="Send a chat message..."
src/components/LiveStreams.tsx:1283:                        className="w-full text-xs bg-[#070a11] text-white border border-slate-800 rounded-xl px-3.5 pr-8 py-2.5 outline-none focus:border-sky-505 transition-all font-medium placeholder-slate-550 shadow-inner"
src/components/LiveStreams.tsx:1331:              {/* Camera canvas / Dynamic interactive streaming mockup */}
src/components/LiveStreams.tsx:1419:                    placeholder="e.g. Sweating MLB Late night sweep parlay!" 
src/components/LiveStreams.tsx:1423:                    className="w-full text-xs bg-[#0b0f19] text-white border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-sky-500 font-semibold placeholder-slate-600 disabled:opacity-50"
src/components/LiveStreams.tsx:1431:                    placeholder="e.g. Los Angeles Dodgers @ San Francisco Giants" 
src/components/LiveStreams.tsx:1435:                    className="w-full text-xs bg-[#0b0f19] text-white border border-slate-800 rounded-xl px-3 py-2.5 outline-none focus:border-sky-505 font-semibold placeholder-slate-600 disabled:opacity-50"
src/components/LiveStreams.tsx:1582:                      placeholder={isUserLive ? "Reply to chat fans..." : "Broadcaster muted"}
src/components/LiveStreams.tsx:1586:                      className="flex-1 text-xs bg-[#070a11] text-white border border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-sky-505 font-medium placeholder-slate-600 disabled:opacity-50"
src/components/PlayerResearchConsole.tsx:76:      const savedId = localStorage.getItem('vouchedge_selected_research_player_id');
src/components/PlayerResearchConsole.tsx:278:      localStorage.setItem('vouchedge_selected_research_player_id', player.id);
src/components/PlayerResearchConsole.tsx:493:                placeholder="Search MLB player or position..." 
src/components/PlayerResearchConsole.tsx:494:                className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl py-3 pl-10 pr-10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
src/components/PlayerResearchConsole.tsx:1046:                {/* Bottom Section Layout split into two sections: demographics grid & stats blocks */}
src/components/PlayerResearchConsole.tsx:1284:                          Expected weighted On-Base Average (xwOBA) matches actual batted trajectory, demonstrating{' '}
src/components/VouchBoard.tsx:233:    const sharedParlayVouchId = localStorage.getItem('vEdge_preview_shared_parlay_vouch_id');
src/components/VouchBoard.tsx:433:    // Package as a customized mock file url or serialized parlay
src/components/VouchBoard.tsx:1351:                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-1 rounded outline-none font-bold placeholder-slate-650"
src/components/VouchBoard.tsx:1352:                          placeholder="e.g. Over 0.5 HRs"
src/components/VouchBoard.tsx:1412:                          placeholder={
src/components/VouchBoard.tsx:1437:                placeholder="Give your primary sabermetric reasoning..."
src/components/VouchBoard.tsx:1673:                      className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[11px] font-bold text-sky-400 outline-none placeholder-slate-700" 
src/components/VouchBoard.tsx:1816:                      placeholder="e.g. SAVE20"
src/components/VouchBoard.tsx:2098:                  const sharedId = localStorage.getItem('vEdge_preview_shared_parlay_vouch_id');
src/components/VouchBoard.tsx:2673:                        const mockSparkPoints = idx % 3 === 0 
src/components/VouchBoard.tsx:2718:                                    points={mockSparkPoints} 
src/components/VouchBoard.tsx:2720:                                  <circle cx="95" cy={mockSparkPoints.split(" ").pop()?.split(",")[1]} r="2" fill={activeStyle.activeLineColor1} />
src/components/VouchBoard.tsx:2931:                    className="w-full text-xs bg-transparent border-none text-slate-100 placeholder-slate-600 outline-none resize-none pt-1"
src/components/VouchBoard.tsx:2932:                    placeholder="What's happening on the edge..."
src/components/ParlayStudio.tsx:72:  // Load saved legs from localStorage
src/components/ParlayStudio.tsx:74:    const saved = localStorage.getItem("vouchedge_parlay_studio_legs");
src/components/ParlayStudio.tsx:87:    localStorage.setItem("vouchedge_parlay_studio_legs", JSON.stringify(legs));
src/components/ParlayStudio.tsx:400:          placeholder="Search picks..."
src/components/ParlayStudio.tsx:403:          className="w-full rounded-lg py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
src/components/ParlayStudio.tsx:508:          placeholder="Parlay title..."
src/components/ParlayStudio.tsx:785:            <div className="text-[10px] text-slate-500 font-mono">@{profile?.username || "sample"} · Demo</div>
src/components/pro/VerifiedGraphEmptyState.tsx:7: * This component NEVER fakes data. It shows exactly what's missing.
src/components/pro/ProGraphShell.tsx:59:            Verified data feed required. No fake graph data shown.
src/components/pro/HrSignalGraphs.tsx:225:   Section 5: Locked Future Graphs — always locked, never faked
src/components/pro/ProLockedCard.tsx:23:  const copy = detail ?? description ?? 'Verified data feed required. No fake data shown.';
src/components/pro/VerifiedDataNotice.tsx:44:    defaultDetail: 'This module is under development. No data is being faked.',
src/components/SettingsPage.tsx:61:  const [streamServer, setStreamServer] = useState(() => localStorage.getItem('vEdge_streamServer') || 'twitch');
src/components/SettingsPage.tsx:62:  const [streamKey, setStreamKey] = useState(() => localStorage.getItem('vEdge_streamKey') || 'live_sk_vouchedge_7bd288e34f89ac9920');
src/components/SettingsPage.tsx:63:  const [resolution, setResolution] = useState(() => localStorage.getItem('vEdge_resolution') || '1080p');
src/components/SettingsPage.tsx:64:  const [bitrate, setBitrate] = useState(() => localStorage.getItem('vEdge_bitrate') || '6000');
src/components/SettingsPage.tsx:65:  const [encoder, setEncoder] = useState(() => localStorage.getItem('vEdge_encoder') || 'nvenc');
src/components/SettingsPage.tsx:66:  const [noiseGate, setNoiseGate] = useState(() => Number(localStorage.getItem('vEdge_noiseGate')) || -45);
src/components/SettingsPage.tsx:67:  const [compressor, setCompressor] = useState(() => localStorage.getItem('vEdge_compressor') || 'medium');
src/components/SettingsPage.tsx:68:  const [latencyMode, setLatencyMode] = useState(() => localStorage.getItem('vEdge_latencyMode') || 'ultra');
src/components/SettingsPage.tsx:69:  const [enableOverlayWidgets, setEnableOverlayWidgets] = useState(() => localStorage.getItem('vEdge_enableOverlayWidgets') !== 'false');
src/components/SettingsPage.tsx:72:  const [activeAdSponsor, setActiveAdSponsor] = useState(() => localStorage.getItem('vEdge_adSponsor') || 'DraftKings');
src/components/SettingsPage.tsx:73:  const [adIntensity, setAdIntensity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(() => (localStorage.getItem('vEdge_adIntensity') as any) || 'MEDIUM');
src/components/SettingsPage.tsx:74:  const [cpmRate, setCpmRate] = useState(() => Number(localStorage.getItem('vEdge_cpmRate')) || 12.50);
src/components/SettingsPage.tsx:82:  // Load streaming params into localStorage
src/components/SettingsPage.tsx:84:    localStorage.setItem('vEdge_streamServer', streamServer);
src/components/SettingsPage.tsx:85:    localStorage.setItem('vEdge_streamKey', streamKey);
src/components/SettingsPage.tsx:86:    localStorage.setItem('vEdge_resolution', resolution);
src/components/SettingsPage.tsx:87:    localStorage.setItem('vEdge_bitrate', bitrate);
src/components/SettingsPage.tsx:88:    localStorage.setItem('vEdge_encoder', encoder);
src/components/SettingsPage.tsx:89:    localStorage.setItem('vEdge_noiseGate', String(noiseGate));
src/components/SettingsPage.tsx:90:    localStorage.setItem('vEdge_compressor', compressor);
src/components/SettingsPage.tsx:91:    localStorage.setItem('vEdge_latencyMode', latencyMode);
src/components/SettingsPage.tsx:92:    localStorage.setItem('vEdge_enableOverlayWidgets', String(enableOverlayWidgets));
src/components/SettingsPage.tsx:95:  // Load ad settings into localStorage
src/components/SettingsPage.tsx:97:    localStorage.setItem('vEdge_adSponsor', activeAdSponsor);
src/components/SettingsPage.tsx:98:    localStorage.setItem('vEdge_adIntensity', adIntensity);
src/components/SettingsPage.tsx:99:    localStorage.setItem('vEdge_cpmRate', String(cpmRate));
src/components/SettingsPage.tsx:259:                      placeholder="e.g. Master Prophet"
src/components/SettingsPage.tsx:357:                      const stored = localStorage.getItem('vouchedge_market_themes');
src/components/WelcomePortal.tsx:49:  localStorage.setItem('vouchedge_theme_choice', themeId);
src/components/WelcomePortal.tsx:91:    const saved = localStorage.getItem('vouchedge_theme_choice') as WelcomeThemeId | null;
src/components/PremiumSubPage.tsx:42:    const storedBeta = localStorage.getItem('vouchedge_beta_email');
src/components/PremiumSubPage.tsx:43:    const storedBetaID = localStorage.getItem('vouchedge_beta_id');
src/components/PremiumSubPage.tsx:79:      localStorage.setItem('vouchedge_beta_email', betaEmail);
src/components/PremiumSubPage.tsx:80:      localStorage.setItem('vouchedge_beta_id', regID);
src/components/PremiumSubPage.tsx:170:                  placeholder="name@domain.com"
src/components/ProfilePage.tsx:47:        const stored = localStorage.getItem('vouchedge_market_themes');
src/components/ProfilePage.tsx:76:      const stored = localStorage.getItem('vouchedge_following');
src/components/auth/AuthModal.tsx:334:                placeholder="you@email.com"
src/components/auth/AuthModal.tsx:337:                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
src/components/auth/AuthModal.tsx:355:                      placeholder="username"
src/components/auth/AuthModal.tsx:358:                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
src/components/auth/AuthModal.tsx:379:                  placeholder="Password"
src/components/auth/AuthModal.tsx:382:                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
src/components/auth/AuthModal.tsx:419:                      placeholder="Invite code — optional (VE-XXXXXXXX)"
src/components/auth/AuthModal.tsx:422:                      className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none tracking-wide"
src/components/auth/AuthGate.tsx:99:              placeholder="Username (3-24 chars)"
src/components/auth/AuthGate.tsx:109:            placeholder="Email"
src/components/auth/AuthGate.tsx:116:            placeholder="Password"
src/components/auth/AuthGate.tsx:125:              placeholder="Invite code (VE-XXXXXXXX)"
src/components/auth/AuthStatusBadge.tsx:7:  localStorage.removeItem('vouchedge_after_auth_destination');
src/components/auth/AuthStatusBadge.tsx:8:  localStorage.removeItem('activeSection');
src/components/auth/AuthStatusBadge.tsx:9:  localStorage.removeItem('selectedSection');
src/components/auth/AuthStatusBadge.tsx:10:  sessionStorage.removeItem('vouchedge_active_section');
src/components/auth/AuthStatusBadge.tsx:14:  localStorage.removeItem('vouchedge_auth_token');
src/components/auth/AuthStatusBadge.tsx:15:  localStorage.removeItem('mlb_ai_auth_token');
src/components/auth/AuthStatusBadge.tsx:16:  localStorage.removeItem('vouchedge_after_auth_destination');
src/components/auth/AuthStatusBadge.tsx:18:  // remove old/demo/local auth-ish keys without deleting everything
src/components/auth/AuthStatusBadge.tsx:19:  Object.keys(localStorage).forEach((key) => {
src/components/auth/AuthStatusBadge.tsx:22:      lower.includes('demo') ||
src/components/auth/AuthStatusBadge.tsx:23:      lower.includes('fake') ||
src/components/auth/AuthStatusBadge.tsx:24:      lower.includes('mock') ||
src/components/auth/AuthStatusBadge.tsx:29:      localStorage.removeItem(key);
src/components/auth/AuthStatusBadge.tsx:62:        localStorage.setItem('vouchedge_auth_token', sessionData.session.access_token);
src/components/auth/AuthStatusBadge.tsx:79:      localStorage.setItem('vouchedge_auth_token', session.access_token);
src/components/hr-board/HrPlayerDrawer.tsx:123:      detail: "Team history vs hitter, recent opponent trends, and matchup context. No fake history shown.",
src/components/hr-board/HrPlayerDrawer.tsx:192:          Pro modules are locked until verified data feeds are connected. VouchEdge will not show fake batter-vs-pitcher, zone, or matchup-history stats.
src/components/hr-board/HrBoardFilters.tsx:45:        <input value={filters.search} onChange={(e) => onChange({ search: e.target.value })} placeholder="Search player…"
src/components/AisLandingPage.tsx:1327:                            placeholder="e.g. Captain Vouch Walker"
src/components/AisLandingPage.tsx:1328:                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-yellow-400/50"
src/components/AisLandingPage.tsx:1341:                              placeholder="vouch_skywalker"
src/components/AisLandingPage.tsx:1342:                              className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-yellow-400/50"
src/components/MlbIntelligenceHub.tsx:422:        disclaimer: 'AI Edge Lab is temporarily unavailable. No fake data shown.',
src/components/MlbIntelligenceHub.tsx:508:    { code: 'RA', name: 'Risk Auditor', role: 'Skeptical filter', focus: 'Flags missing data, projected lineups, and fake confidence traps.', signal: 'Risk check' },
src/components/MlbIntelligenceHub.tsx:616:            The page is safe and no fake data is shown. Refresh once the HR Board endpoint returns candidates.
src/components/admin/AdminDashboard.tsx:238:          placeholder="user@example.com"
src/components/admin/AdminDashboard.tsx:257:          placeholder={"user1@example.com\nuser2@example.com"}
src/components/admin/AdminDashboard.tsx:331:  async function handleAction(id: string, action: "ban" | "unban" | "promote" | "demote") {
src/components/admin/AdminDashboard.tsx:336:    if (action === "demote") updates.is_staff = false;
src/components/admin/AdminDashboard.tsx:355:        placeholder="Search by username or display name…"
src/components/admin/AdminDashboard.tsx:388:                  <button onClick={() => handleAction(u.id, "demote")}>Demote</button>
src/components/admin/AdminDashboard.tsx:411:    is_demo: true,
src/components/admin/AdminDashboard.tsx:431:      setNewCapper({ id: "", display_name: "", tagline: "", is_demo: true });
src/components/admin/AdminDashboard.tsx:457:              <td>{c.is_demo ? "DEMO" : ""}</td>
src/components/admin/AdminDashboard.tsx:469:          placeholder="id (lowercase, hyphens)"
src/components/admin/AdminDashboard.tsx:474:          placeholder="Display name"
src/components/admin/AdminDashboard.tsx:479:          placeholder="Tagline (optional)"
src/components/admin/AdminDashboard.tsx:486:            checked={newCapper.is_demo}
src/components/admin/AdminDashboard.tsx:487:            onChange={(e) => setNewCapper({ ...newCapper, is_demo: e.target.checked })}
src/components/edgePortal/EdgePortal.tsx:40:  localStorage.setItem('vouchedge_theme_choice', themeId);
src/components/edgePortal/EdgePortal.tsx:79:    const saved = localStorage.getItem('vouchedge_theme_choice') as WelcomeThemeId | null;
src/components/vouchedge/EpicThemeShowcase.tsx:356:                                  <div className="text-[10px]" style={{ color: DC.textMuted }}>@sample_capper</div>
src/components/SubscriberHub.tsx:66:    const cached = localStorage.getItem('vouchedge_subscribed_cappers');
src/components/SubscriberHub.tsx:73:    const cached = localStorage.getItem('vouchedge_theme_credits');
src/components/SubscriberHub.tsx:83:    const cached = localStorage.getItem('vouchedge_capper_sub_plans_durations_v1');
src/components/SubscriberHub.tsx:167:      const cachedMsgs = localStorage.getItem('vouchedge_sub_messages');
src/components/SubscriberHub.tsx:173:            { id: 'm1', userId: 'usr-9', displayName: 'Demo User', username: 'demo_user', text: 'Sample message — subscriber chat in development.', timestamp: new Date(Date.now() - 36000000).toISOString() },
src/components/SubscriberHub.tsx:174:            { id: 'm2', userId: 'usr-8', displayName: 'Demo User 2', username: 'demo_user_2', text: 'Demo message for layout testing.', timestamp: new Date(Date.now() - 18000000).toISOString() },
src/components/SubscriberHub.tsx:175:            { id: 'm3', userId: 'c-user-current', displayName: profile.displayName, username: profile.username, text: 'Welcome to the subscriber chat. This is a demo — real messages appear once subscribers join.', timestamp: new Date(Date.now() - 4000000).toISOString(), isCapper: true }
src/components/SubscriberHub.tsx:178:            { id: 'ag1', userId: 'usr-2', displayName: 'Demo User 3', username: 'demo_user_3', text: 'Sample question — demo chat in development.', timestamp: new Date(Date.now() - 36000000).toISOString() },
src/components/SubscriberHub.tsx:182:            { id: 'hp1', userId: 'usr-5', displayName: 'Demo User 4', username: 'demo_user_4', text: 'Demo message — subscriber chat in development.', timestamp: new Date(Date.now() - 20000000).toISOString() }
src/components/SubscriberHub.tsx:186:        localStorage.setItem('vouchedge_sub_messages', JSON.stringify(initialMsgs));
src/components/SubscriberHub.tsx:190:      const cachedPremClass = localStorage.getItem('vouchedge_subscriber_parlays');
src/components/SubscriberHub.tsx:214:        localStorage.setItem('vouchedge_subscriber_parlays', JSON.stringify(initialPrem));
src/components/SubscriberHub.tsx:218:      const cachedReacts = localStorage.getItem('vouchedge_subs_parlay_reactions');
src/components/SubscriberHub.tsx:224:      const cachedAnnounce = localStorage.getItem('vouchedge_capper_announcements');
src/components/SubscriberHub.tsx:241:        localStorage.setItem('vouchedge_capper_announcements', JSON.stringify(defaultAnnounce));
src/components/SubscriberHub.tsx:256:    localStorage.setItem('vouchedge_theme_credits', nextCre.toString());
src/components/SubscriberHub.tsx:260:    localStorage.setItem('vouchedge_subscribed_cappers', JSON.stringify(updated));
src/components/SubscriberHub.tsx:294:    localStorage.setItem('vouchedge_sub_messages', JSON.stringify(updated));
src/components/SubscriberHub.tsx:322:        localStorage.setItem('vouchedge_sub_messages', JSON.stringify(nextUpdated));
src/components/SubscriberHub.tsx:341:    localStorage.setItem('vouchedge_subs_parlay_reactions', JSON.stringify(updated));
src/components/SubscriberHub.tsx:353:    localStorage.setItem('vouchedge_capper_sub_plans_durations_v1', JSON.stringify(updated));
src/components/SubscriberHub.tsx:369:    localStorage.setItem('vouchedge_capper_announcements', JSON.stringify(n));
src/components/SubscriberHub.tsx:379:        Subscriber counts and capper clubs are sample data — real clubs populate when cappers go live.
src/components/SubscriberHub.tsx:704:                        placeholder={`Message Premium Club as @${profile.username}...`}
src/components/SubscriberHub.tsx:705:                        className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-505 rounded-xl px-4 py-3 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 placeholder-slate-550 outline-none transition-all font-semibold"
src/components/SubscriberHub.tsx:846:                          placeholder="Type official details or voucher allocation announcement here..."
src/components/SubscriberHub.tsx:847:                          className="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-505 rounded-lg px-3 py-2 text-slate-100 text-xs placeholder-slate-550 outline-none"
src/components/SubscriberHub.tsx:939:                            placeholder="e.g. Save 10%"
src/components/results/ResultsLedgerSummary.tsx:49:        <Info className="w-2.5 h-2.5" /> Tracked from your saved slips. Picks are <span className="text-slate-400">Unverified</span> until graded after game finals — no faked verified records.
src/components/results/ResultsStudio.tsx:17: * Uses existing savedSlips + posts data. No fake results.
src/components/results/ResultsStudio.tsx:142:                Every saved slip, graded after final from the official box score. Unverified until settled — no faked records.
src/components/results/ResultsStudio.tsx:248:                  placeholder="Search slips..."
src/components/results/ResultsStudio.tsx:251:                  className="w-full rounded-lg py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
src/components/results/ResultsStudio.tsx:317:            {/* AI Capper placeholder */}
src/components/results/ResultsStudio.tsx:329:              VouchEdge is for sports research, social proof, and entertainment. Probability-based. No guarantees. Results are tracked from real saved slips — no faked verified records.
src/components/ResultsPage.tsx:380:        localStorage.getItem('vouchedge_auth_token') ||
src/components/ResultsPage.tsx:381:        localStorage.getItem('mlb_ai_auth_token');
src/components/ResultsPage.tsx:425:  // Sync with localStorage
src/components/ResultsPage.tsx:427:    const cachedPicks = localStorage.getItem('vai_ai_parlay_picks_history');
src/components/ResultsPage.tsx:428:    const cachedWinRate = localStorage.getItem('vai_ai_win_rate_level');
src/components/ResultsPage.tsx:429:    const cachedTotalCount = localStorage.getItem('vai_ai_total_picks_count');
src/components/ResultsPage.tsx:435:        localStorage.setItem('vai_ai_parlay_picks_history', JSON.stringify(INITIAL_AI_PARLAYS));
src/components/ResultsPage.tsx:441:      localStorage.setItem('vai_ai_parlay_picks_history', JSON.stringify(INITIAL_AI_PARLAYS));
src/components/ResultsPage.tsx:447:      localStorage.setItem('vai_ai_win_rate_level', '61.4');
src/components/ResultsPage.tsx:453:      localStorage.setItem('vai_ai_total_picks_count', '142');
src/components/ResultsPage.tsx:617:        localStorage.setItem('vouchedge_staged_legs_cache', JSON.stringify(mappedLegs));
src/components/ResultsPage.tsx:638:      localStorage.setItem('vai_ai_parlay_picks_history', JSON.stringify(updated));
src/components/ResultsPage.tsx:645:      localStorage.setItem('vai_ai_win_rate_level', computedWinRate.toString());
src/components/ResultsPage.tsx:646:      localStorage.setItem('vai_ai_total_picks_count', (142 + updated.length - INITIAL_AI_PARLAYS.length).toString());
src/components/ResultsPage.tsx:653:  // Synchronous elegant analytics reload (replaces mock larping terminal)
src/components/ResultsPage.tsx:709:        localStorage.setItem('vai_ai_parlay_picks_history', JSON.stringify(updatedArray));
src/components/ResultsPage.tsx:719:    localStorage.removeItem('vai_ai_parlay_picks_history');
src/components/ResultsPage.tsx:720:    localStorage.removeItem('vai_ai_win_rate_level');
src/components/ResultsPage.tsx:721:    localStorage.removeItem('vai_ai_total_picks_count');
src/components/profile/ProfileShareCard.tsx:73:        {/* Dynamic theme particles demo symbols */}
src/components/theme/ThemeProvider.tsx:85:  // Manage user credits in localStorage
src/components/theme/ThemeProvider.tsx:87:    const cached = localStorage.getItem('vouchedge_theme_credits');
src/components/theme/ThemeProvider.tsx:89:    localStorage.setItem('vouchedge_theme_credits', '1000');
src/components/theme/ThemeProvider.tsx:95:    localStorage.setItem('vouchedge_theme_credits', val.toString());
src/components/LiveGamesPro.tsx:129:      winProbModel: ['Win probability feed not connected for this fast preview. No fake model edge shown.'],
src/components/LiveGamesPro.tsx:389:        setError('No live game data available. No fake games shown.');
src/components/LiveGamesPro.tsx:397:        setError('Live games unavailable right now. No fake games shown.');
src/components/LiveGamesPro.tsx:443:            <p className="text-xs text-slate-400 mt-1 max-w-md">Real MLB game cards with scores, inning context, HR watch, pitcher matchups, and Pro live-stat upgrades. No fake live data.</p>
src/components/SmartAiEngine.tsx:580:      localStorage.setItem('vouchedge_selected_research_player_id', player.id);
src/components/SmartAiEngine.tsx:1182:                  placeholder="Search 850 precomputed entries by player name, ID (e.g. VAI-9004), matchup, spec..."
src/components/SmartAiEngine.tsx:1185:                  className="w-full bg-slate-900 border border-slate-850 focus:border-sky-500/50 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
src/components/ParlayLab.tsx:347:        const cached = localStorage.getItem('vouchedge_subscriber_parlays');
src/components/ParlayLab.tsx:350:        localStorage.setItem('vouchedge_subscriber_parlays', JSON.stringify(updatedPrem));
src/components/ParlayLab.tsx:387:        const cached = localStorage.getItem('vouchedge_subscriber_parlays');
src/components/ParlayLab.tsx:390:        localStorage.setItem('vouchedge_subscriber_parlays', JSON.stringify(updatedPrem));
src/components/ParlayLab.tsx:434:    localStorage.setItem('vEdge_preview_shared_parlay_vouch_id', associatedVouch.id);
src/components/ParlayLab.tsx:567:                    placeholder="e.g. Ohtani, Judge, Soto..."
src/components/ParlayLab.tsx:803:                        localStorage.setItem('vouchedge_selected_research_player_id', player.id);
src/components/ParlayLab.tsx:907:                      placeholder="e.g. Sharp MLB Slip"
src/components/ParlayLab.tsx:998:                    placeholder="Provide your edge analysis here (e.g. platoon stats, wind coefficients, umpire hitter-friendliness, bullpen exhaustions)..."
src/components/theEdge/TheEdgeShell.tsx:202:  // Real today's slate for the scoreboard ticker (no fake games).
src/components/theEdge/TheEdgeShell.tsx:226:  // ── Real proof numbers (no placeholders) ──
src/components/theEdge/TheEdgeShell.tsx:246:        localStorage.getItem('vouchedge_auth_token') ||
src/components/theEdge/TheEdgeShell.tsx:247:        localStorage.getItem('mlb_ai_auth_token');
src/components/theEdge/TheEdgeShell.tsx:289:    localStorage.setItem('vouchedge_after_auth_mode', 'island');
src/components/theEdge/TheEdgeShell.tsx:290:    localStorage.setItem('vouchedge_signup_plan', plan);
src/components/theEdge/TheEdgeShell.tsx:291:    localStorage.setItem('vouchedge_policy_agreed_at', new Date().toISOString());
src/components/theEdge/TheEdgeShell.tsx:602:                      placeholder="Email"
src/components/theEdge/TheEdgeShell.tsx:610:                      placeholder="Password"
src/components/theEdge/TheEdgeShell.tsx:702:                            placeholder="Name"
src/components/theEdge/TheEdgeShell.tsx:709:                            placeholder="Email"
src/components/theEdge/TheEdgeShell.tsx:717:                            placeholder="Password"
src/components/theEdge/TheEdgeShell.tsx:802:                            <input className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" placeholder="Card number" inputMode="numeric" />
src/components/theEdge/TheEdgeShell.tsx:805:                            <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="MM / YY" />
src/components/theEdge/TheEdgeShell.tsx:806:                            <input className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50" placeholder="CVC" />
src/components/VouchStudioDarkroom.tsx:771:                                placeholder="e.g. Over 0.5 HRs"
src/components/VouchStudioDarkroom.tsx:829:                              placeholder="Insights on launch rate, pitch matchup or historical batting averages..."
src/components/VouchStudioDarkroom.tsx:851:                                    placeholder="Luis Castillo"
src/components/VouchStudioDarkroom.tsx:886:                                    placeholder="3.55"
src/components/VouchStudioDarkroom.tsx:900:                                    placeholder="vs Sweeper Slider (.342 AVG)"
src/components/VouchStudioDarkroom.tsx:956:                                  placeholder="E.g., Matchup modeling verifies +12.4% success corridor..."
src/components/VouchStudioDarkroom.tsx:1194:                    placeholder="Detail the primary sabermetric, wind speed, velocity coefficients or pitch leverage indexes..."
src/components/ThemeStore.tsx:59:    const cached = localStorage.getItem('vouchedge_market_themes');
src/components/ThemeStore.tsx:175:        localStorage.setItem('vouchedge_market_themes', JSON.stringify(updatedMarketList));
src/components/ThemeStore.tsx:240:    localStorage.setItem('vouchedge_market_themes', JSON.stringify(updatedMarketList));
src/components/ThemeStore.tsx:808:                placeholder="e.g. Retro arcade theme themed on Boston ballpark under green skies..."
```

## 8. Results / Parlay / Account Data Frontend
```txt
src/App.tsx:4:import ParlayLab from './components/ParlayLab';
src/App.tsx:7:import ResultsPage from './components/ResultsPage';
src/App.tsx:532:      const created = await apiClient.post<{ id: string }>('/api/parlays', payload);
src/App.tsx:786:  // Save new parlay created in ParlayLab
src/types.ts:47:  /** Backend pick id after /api/parlays accepts this slip. */
src/components/ResultsPage.tsx:29:interface ResultsPageProps {
src/components/ResultsPage.tsx:337:export default function ResultsPage({ posts, profile, onTailParlay, savedParlays = [] }: ResultsPageProps) {
src/components/ResultsPage.tsx:347:  const [backendLedger, setBackendLedger] = useState<BackendLedgerResponse | null>(null);
src/components/ResultsPage.tsx:348:  const [backendLedgerLoading, setBackendLedgerLoading] = useState(false);
src/components/ResultsPage.tsx:349:  const [backendLedgerError, setBackendLedgerError] = useState<string | null>(null);
src/components/ResultsPage.tsx:392:        const response = await fetch('/api/me/ledger?limit=100', {
src/components/ResultsPage.tsx:738:              Results are now connected to /api/me/ledger
src/components/ResultsPage.tsx:741:              {backendLedgerLoading
src/components/ResultsPage.tsx:743:                : backendLedgerError
src/components/ResultsPage.tsx:744:                  ? backendLedgerError
src/components/ResultsPage.tsx:745:                  : backendLedger
src/components/ResultsPage.tsx:746:                    ? `${backendLedger.summary.total} saved picks loaded from Supabase-backed ledger.`
src/components/ResultsPage.tsx:753:              <div className="text-lg font-black text-white">{backendLedger?.summary.pending ?? 0}</div>
src/components/ResultsPage.tsx:757:              <div className="text-lg font-black text-emerald-300">{backendLedger?.summary.won ?? 0}</div>
src/components/ResultsPage.tsx:761:              <div className="text-lg font-black text-red-300">{backendLedger?.summary.lost ?? 0}</div>
src/components/ResultsPage.tsx:765:              <div className="text-lg font-black text-cyan-300">{backendLedger?.summary.parlays ?? 0}</div>
src/components/ParlayLab.tsx:25:import ResultsPage from './ResultsPage';
src/components/ParlayLab.tsx:31:interface ParlayLabProps {
src/components/ParlayLab.tsx:44:export default function ParlayLab({ 
src/components/ParlayLab.tsx:55:}: ParlayLabProps) {
src/components/ParlayLab.tsx:521:              <ResultsPage
src/components/theEdge/TheEdgeShell.tsx:161:  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryResponse | null>(null);
src/components/theEdge/TheEdgeShell.tsx:162:  const [dashboardSummaryLoading, setDashboardSummaryLoading] = useState(false);
src/components/theEdge/TheEdgeShell.tsx:237:  }, [savedParlays, profile, slate, dashboardSummary]);
src/components/theEdge/TheEdgeShell.tsx:254:        const response = await fetch('/api/me/dashboard-summary', {
src/components/theEdge/TheEdgeShell.tsx:925:                    <Stat label="Saved picks" value={dashboardSummaryLoading ? '...' : stats.savedPicks} tone="cyan" />
src/components/theEdge/TheEdgeShell.tsx:926:                    <Stat label="Saved parlays" value={dashboardSummaryLoading ? '...' : stats.saved} tone="cyan" />
src/components/theEdge/TheEdgeShell.tsx:927:                    <Stat label="Pending" value={dashboardSummaryLoading ? '...' : stats.pending} tone="white" />
src/components/theEdge/TheEdgeShell.tsx:929:                    <Stat label="Proof score" value={dashboardSummaryLoading ? '...' : stats.proofScore} tone="violet" />
src/lib/parlayGrading.ts:2: * Client-side parlay grading — calls the stateless POST /api/parlays/grade
src/lib/parlayGrading.ts:8: * ({ sport, gamePk, market, selection }) is what POST /api/parlays expects.
src/lib/parlayGrading.ts:62:    const res = await fetch('/api/parlays/grade', {
src/lib/migrateLocalStorage.ts:155: * Migrate vouchedge_slips → /api/parlays POST
src/lib/migrateLocalStorage.ts:185:        await apiClient.post("/api/parlays", {
server/routes/parlayRoutes.ts:12: *   POST /api/parlays              — create a parlay with N legs
server/routes/parlayRoutes.ts:13: *   GET  /api/parlays/:id          — get parlay with legs
server/routes/parlayRoutes.ts:14: *   GET  /api/parlays?user_id=X    — list user's parlays
server/routes/parlayRoutes.ts:28:   POST /api/parlays/grade  — stateless grading (no auth, no DB)
server/routes/parlayRoutes.ts:151: * POST /api/parlays
server/routes/parlayRoutes.ts:246: * GET /api/parlays/:id
server/routes/parlayRoutes.ts:279: * GET /api/parlays?user_id=X&limit=50&offset=0
server/routes/parlayRoutes.ts:285: * GET /api/me/ledger
server/routes/parlayRoutes.ts:292: * GET /api/me/dashboard-summary
server/services/grading/sportGraders.ts:10: *   - the stateless POST /api/parlays/grade endpoint (no DB)
```

## 9. Backend Routes and Auth Protection
```txt
server/middleware/validation.ts:16: *   router.post("/picks", requireAuth, validate({ body: CreatePickSchema }), createPickHandler);
server/middleware/entitlements.ts:12: *   router.post("/api/picks", requireAuth, requireTier("gold"), createPickHandler);
server/middleware/entitlements.ts:13: *   router.post("/api/ai/explain-pick", requireAuth, requireTierOrQuota("free", 20, "ai_explain"), ...);
server/middleware/webhookRaw.ts:12: *   app.post("/api/billing/webhook", webhookRawBody, billingRoutes);  // OR
server/middleware/webhookRaw.ts:13: *   app.use("/api/billing/webhook", webhookRawBody, billingRouter);
server/middleware/webhookRaw.ts:17: *   app.post(
server/middleware/rateLimit.ts:135: *   import { createClient } from "redis";
server/middleware/rateLimit.ts:137: *   const redis = createClient({ url: process.env.REDIS_URL });
server/middleware/auth.ts:2:import { createClient, type SupabaseClient } from "@supabase/supabase-js";
server/middleware/auth.ts:14:    supabaseAdminClient = createClient(
server/middleware/auth.ts:16:      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) ?? "",
server/middleware/auth.ts:45: *   router.post("/picks", requireAuth, createPickHandler);
server/middleware/auth.ts:46: *   router.post("/admin/...", requireAuth, requireStaff, ...);
server/middleware/auth.ts:66:export async function requireAuth(
server/middleware/auth.ts:155: * Staff gate — must come after requireAuth.
server/middleware/auth.ts:165: * Age + jurisdiction gate — must come after requireAuth.
server/lib/sentry.ts:83: *   app.use(sentryRequestHandler());
server/lib/sentry.ts:85: *   app.use(sentryErrorHandler());
server/lib/sentry.ts:127: *   router.post("/picks", requireAuth, asyncHandler(async (req, res) => {
server/lib/sentry.ts:162: *   VITE_POSTHOG_HOST=https://app.posthog.com
server/routes/postRoutes.ts:4:import { AuthedRequest, requireAuth, optionalAuth, supabaseAdmin } from "../middleware/auth";
server/routes/postRoutes.ts:125:  requireAuth,
server/routes/postRoutes.ts:203:postRoutes.delete("/posts/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/postRoutes.ts:236:postRoutes.post("/posts/:id/like", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/postRoutes.ts:265:postRoutes.delete("/posts/:id/like", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/postRoutes.ts:290:  requireAuth,
server/routes/postRoutes.ts:343:postRoutes.delete("/comments/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/mlbRoutes.ts:70:  app.get("/api/mlb/games/today", async (_req: Request, res: Response) => {
server/routes/mlbRoutes.ts:75:  app.get("/api/mlb/lineup/today", async (req: Request, res: Response) => {
server/routes/mlbRoutes.ts:95:  app.get("/api/mlb/games/date/:date", async (req: Request, res: Response) => {
server/routes/mlbRoutes.ts:99:  app.get("/api/mlb/game/:gamePk", async (req: Request, res: Response) => {
server/routes/mlbRoutes.ts:105:  app.get("/api/mlb/probable-pitchers/:date", async (req: Request, res: Response) => {
server/routes/mlbRoutes.ts:109:  app.get("/api/mlb/reports/daily", async (req: Request, res: Response) => {
server/routes/mlbRoutes.ts:118:  app.get("/api/mlb/reports/vulnerable-pitchers", async (req: Request, res: Response) => {
server/routes/mlbRoutes.ts:127:  app.get("/api/mlb/reports/hr-targets", async (req: Request, res: Response) => {
server/routes/mlbRoutes.ts:136:  app.get("/api/mlb/reports/sneaky-hr", async (req: Request, res: Response) => {
server/routes/mlbRoutes.ts:145:  app.get("/api/mlb/reports/rbi-targets", async (req: Request, res: Response) => {
server/routes/mlbRoutes.ts:154:  app.get("/api/mlb/reports/run-environments", async (req: Request, res: Response) => {
server/routes/resultRoutes.ts:7:  app.get("/api/results/ledger", (req: Request, res: Response) => {
server/routes/resultRoutes.ts:12:  app.post("/api/results/grade", async (req: Request, res: Response) => {
server/routes/adminRoutes.ts:4:import { AuthedRequest, requireAuth, requireStaff, supabaseAdmin } from "../middleware/auth";
server/routes/adminRoutes.ts:21: * All routes require requireAuth + requireStaff.
server/routes/adminRoutes.ts:31:  requireAuth,
server/routes/adminRoutes.ts:57:  requireAuth,
server/routes/adminRoutes.ts:76:  requireAuth,
server/routes/adminRoutes.ts:101:  requireAuth,
server/routes/adminRoutes.ts:120:  requireAuth,
server/routes/adminRoutes.ts:147:  requireAuth,
server/routes/adminRoutes.ts:181:  requireAuth,
server/routes/adminRoutes.ts:236:  requireAuth,
server/routes/adminRoutes.ts:270:  requireAuth,
server/routes/privacyRoutes.ts:4:import { AuthedRequest, requireAuth, supabaseAdmin } from "../middleware/auth";
server/routes/privacyRoutes.ts:38:privacyRoutes.get("/export", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/privacyRoutes.ts:86: *   - Suspend API access (requireAuth middleware checks is_banned or deletion_scheduled_at)
server/routes/privacyRoutes.ts:90:privacyRoutes.post("/delete-account", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/privacyRoutes.ts:155:privacyRoutes.post("/cancel-deletion", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/privacyRoutes.ts:179:privacyRoutes.get("/deletion-status", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/mlbHrBoardRoutes.ts:26:  app.get("/api/mlb/hr-feed/today", async (_req: Request, res: Response) => {
server/routes/mlbHrBoardRoutes.ts:30:  app.get("/api/mlb/hr-feed/date/:date", async (req: Request, res: Response) => {
server/routes/mlbHrBoardRoutes.ts:36:  app.get("/api/mlb/hr-board/today", async (req: Request, res: Response) => {
server/routes/mlbHrBoardRoutes.ts:50:  app.get("/api/mlb/hr-board/today/pool", async (_req: Request, res: Response) => {
server/routes/mlbHrBoardRoutes.ts:60:  app.get("/api/mlb/hr-board/today/debug", async (_req: Request, res: Response) => {
server/routes/mlbHrBoardRoutes.ts:70:  app.get("/api/mlb/hr-board/today/deep", async (_req: Request, res: Response) => {
server/routes/mlbHrBoardRoutes.ts:88:  app.get("/api/mlb/hr-board/date/:date", async (req: Request, res: Response) => {
server/routes/mlbHrBoardRoutes.ts:97:  app.get("/api/mlb/hr-board/player/:playerId", async (req: Request, res: Response) => {
server/routes/billingRoutes.ts:4:import { AuthedRequest, requireAuth } from "../middleware/auth";
server/routes/billingRoutes.ts:31:  requireAuth,
server/routes/billingRoutes.ts:66:billingRoutes.post("/portal", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/billingRoutes.ts:84:billingRoutes.get("/status", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/aiJudgeSocialRoutes.ts:11:  app.get("/api/ai-judge-social/judges", (_req: Request, res: Response) => {
server/routes/aiJudgeSocialRoutes.ts:19:  app.post("/api/ai-judge-social/generate-hr-drafts", async (req: Request, res: Response) => {
server/routes/aiJudgeSocialRoutes.ts:41:  app.get("/api/ai-judge-social/drafts", (_req: Request, res: Response) => {
server/routes/aiJudgeSocialRoutes.ts:49:  app.post("/api/ai-judge-social/drafts/:draftId/queue", (req: Request, res: Response) => {
server/routes/aiJudgeSocialRoutes.ts:60:  app.post("/api/ai-judge-social/drafts/:draftId/mock-post", (req: Request, res: Response) => {
server/routes/authRoutes.ts:3:import { AuthedRequest, requireAuth, optionalAuth } from "../middleware/auth";
server/routes/authRoutes.ts:19:authRoutes.get("/me", requireAuth, (req: AuthedRequest, res: Response) => {
server/routes/authRoutes.ts:20:  // requireAuth already loaded the profile into req.user.profile
server/routes/authRoutes.ts:31:authRoutes.post("/signout", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/authRoutes.ts:55:  requireAuth,
server/routes/coreRoutes.ts:3:import { AuthedRequest, getSupabaseAdmin, requireAuth, requireLegalConfirmed, requireStaff } from "../middleware/auth";
server/routes/coreRoutes.ts:71:  requireAuth,
server/routes/coreRoutes.ts:101:  requireAuth,
server/routes/coreRoutes.ts:186:  requireAuth,
server/routes/parlayRoutes.ts:3:import { AuthedRequest, getSupabaseAdmin, requireAuth, requireLegalConfirmed } from "../middleware/auth";
server/routes/parlayRoutes.ts:161:  requireAuth,
server/routes/parlayRoutes.ts:249:parlayRoutes.get("/parlays/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/parlayRoutes.ts:295:parlayRoutes.get("/me/dashboard-summary", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/parlayRoutes.ts:359:parlayRoutes.get("/me/ledger", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/parlayRoutes.ts:436:parlayRoutes.get("/me/parlays", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/parlayRoutes.ts:458:parlayRoutes.get("/parlays", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/publicRoutes.ts:3:import { AuthedRequest, requireAuth, optionalAuth, supabaseAdmin } from "../middleware/auth";
server/routes/publicRoutes.ts:392:publicRoutes.post("/follow", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/publicRoutes.ts:426:publicRoutes.delete("/follow", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/publicRoutes.ts:446:publicRoutes.get("/following", requireAuth, async (req: AuthedRequest, res: Response) => {
server/routes/index.ts:20:  app.use("/api", coreRoutes);
server/routes/index.ts:21:  app.use("/api", publicRoutes);
server/routes/index.ts:22:  app.use("/api", parlayRoutes);
server/routes/index.ts:23:  app.use("/api", playerRegistryRoutes);
server/routes/index.ts:24:  app.use("/api", shareRoutes);
server/routes/index.ts:36:  app.get("/api/skills", (_req: Request, res: Response) => res.json({ skills: listSkills() }));
server/routes/index.ts:37:  app.post("/api/skills/:id/run", async (req: Request, res: Response) => {
server/routes/index.ts:46:  app.get("/api/system/core-health", (_req: Request, res: Response) =>
server/routes/index.ts:59:  app.get("/api/health", (_req: Request, res: Response) =>
server/routes/trustRoutes.ts:7:  app.get("/api/trust/user/:userId", (req: Request, res: Response) => {
server/routes/trustRoutes.ts:11:  app.get("/api/trust/capper/:capperId", (req: Request, res: Response) => {
server/routes/agentRoutes.ts:7:  app.get("/api/agents", (_req: Request, res: Response) => {
server/routes/agentRoutes.ts:11:  app.get("/api/agents/:id", (req: Request, res: Response) => {
server/routes/agentRoutes.ts:23:  app.post("/api/agents/:id/generate-picks", async (req: Request, res: Response) => {
server/routes/agentRoutes.ts:44:  app.post("/api/agents/generate-all-picks", async (req: Request, res: Response) => {
server/routes/aiRoutes.ts:9:  app.post("/api/ai/explain-pick", async (req: Request, res: Response) => {
server/routes/aiRoutes.ts:15:  app.post("/api/ai/daily-report", async (req: Request, res: Response) => {
server/routes/aiRoutes.ts:19:  app.post("/api/ai/learning-note", async (req: Request, res: Response) => {
server/routes/mlbMatchupRoutes.ts:6:  app.get("/api/mlb/matchups/today", async (_req: Request, res: Response) => {
server/routes/mlbMatchupRoutes.ts:11:  app.get("/api/mlb/matchups/date/:date", async (req: Request, res: Response) => {
server/routes/mlbMatchupRoutes.ts:16:  app.get("/api/mlb/matchup/:gamePk", async (req: Request, res: Response) => {
server/routes/judgeRoutes.ts:8:  app.post("/api/judge/pick", (req: Request, res: Response) => {
server/routes/judgeRoutes.ts:14:  app.post("/api/judge/parlay", (req: Request, res: Response) => {
server/routes/judgeRoutes.ts:19:  app.post("/api/judge/bias", (req: Request, res: Response) => {
server.ts:17:  app.use(express.json());
server.ts:25:  app.post("/api/ai/chat", async (req, res) => {
server.ts:72:  app.post("/api/ai/generate-image", async (req, res) => {
server.ts:127:  app.post("/api/ai/generate-theme", async (req, res) => {
server.ts:296:  app.post("/api/ai/player-research", async (req, res) => {
server.ts:422:  app.post("/api/ai/parlay-edge", async (req, res) => {
server.ts:543:  app.get("/api/mlb/live", async (req, res) => {
server.ts:752:    app.use(vite.middlewares);
server.ts:755:    app.use(
server.ts:946:  app.get("/api/mlb/games/today", async (_req, res) => {
server.ts:958:  app.get("/api/mlb/games/date/:date", async (req, res) => {
server.ts:970:  app.get("/api/mlb/matchups/today", async (_req, res) => {
server.ts:992:  app.get("/api/mlb/matchup/:gamePk", async (req, res) => {
server.ts:1014:  app.get("/api/mlb/hr-board/today", async (_req, res) => {
server.ts:1039:  app.get("/api/mlb/hr-board/date/:date", async (req, res) => {
server.ts:1062:  app.get("/api/mlb/hr-board/player/:playerId", async (req, res) => {
server.ts:1084:  app.get("/api/mlb/reports/daily", async (req, res) => {
server.ts:1113:  app.get("/api/mlb/reports/vulnerable-pitchers", async (_req, res) => {
server.ts:1121:  app.get("/api/mlb/reports/hr-targets", async (_req, res) => {
server.ts:1138:  app.get("/api/mlb/reports/sneaky-hr", async (_req, res) => {
server.ts:1146:  app.get("/api/mlb/reports/run-environments", async (_req, res) => {
server.ts:1162:  app.get("/api/mlb/hr-feed/today", async (_req, res) => {
server.ts:1177:    app.get("*", (req, res) => {
server.ts:1407:app.get('/api/mlb/daily-player-board', dailyPlayerBoardHandler);
server.ts:1408:app.get('/api/mlb/lineup/today', dailyPlayerBoardHandler);
server.ts:1409:app.get('/api/daily-players', dailyPlayerBoardHandler);
server.ts:1412:app.listen(PORT, "0.0.0.0", () => {
```

## 10. Backend Routes Without requireAuth Nearby
```txt
OK_AUTH_NEARBY: server/middleware/validation.ts:16: *   router.post("/picks", requireAuth, validate({ body: CreatePickSchema }), createPickHandler);
OK_AUTH_NEARBY: server/middleware/entitlements.ts:12: *   router.post("/api/picks", requireAuth, requireTier("gold"), createPickHandler);
OK_AUTH_NEARBY: server/middleware/entitlements.ts:13: *   router.post("/api/ai/explain-pick", requireAuth, requireTierOrQuota("free", 20, "ai_explain"), ...);
CHECK_NO_AUTH_NEARBY: server/middleware/webhookRaw.ts:12: *   app.post("/api/billing/webhook", webhookRawBody, billingRoutes);  // OR
CHECK_NO_AUTH_NEARBY: server/middleware/webhookRaw.ts:17: *   app.post(
OK_AUTH_NEARBY: server/middleware/auth.ts:45: *   router.post("/picks", requireAuth, createPickHandler);
OK_AUTH_NEARBY: server/middleware/auth.ts:46: *   router.post("/admin/...", requireAuth, requireStaff, ...);
OK_AUTH_NEARBY: server/lib/sentry.ts:127: *   router.post("/picks", requireAuth, asyncHandler(async (req, res) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbRoutes.ts:70: app.get("/api/mlb/games/today", async (_req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbRoutes.ts:75: app.get("/api/mlb/lineup/today", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbRoutes.ts:95: app.get("/api/mlb/games/date/:date", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbRoutes.ts:99: app.get("/api/mlb/game/:gamePk", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbRoutes.ts:105: app.get("/api/mlb/probable-pitchers/:date", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbRoutes.ts:109: app.get("/api/mlb/reports/daily", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbRoutes.ts:118: app.get("/api/mlb/reports/vulnerable-pitchers", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbRoutes.ts:127: app.get("/api/mlb/reports/hr-targets", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbRoutes.ts:136: app.get("/api/mlb/reports/sneaky-hr", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbRoutes.ts:145: app.get("/api/mlb/reports/rbi-targets", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbRoutes.ts:154: app.get("/api/mlb/reports/run-environments", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/resultRoutes.ts:7: app.get("/api/results/ledger", (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/resultRoutes.ts:12: app.post("/api/results/grade", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbHrBoardRoutes.ts:26: app.get("/api/mlb/hr-feed/today", async (_req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbHrBoardRoutes.ts:30: app.get("/api/mlb/hr-feed/date/:date", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbHrBoardRoutes.ts:36: app.get("/api/mlb/hr-board/today", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbHrBoardRoutes.ts:50: app.get("/api/mlb/hr-board/today/pool", async (_req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbHrBoardRoutes.ts:60: app.get("/api/mlb/hr-board/today/debug", async (_req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbHrBoardRoutes.ts:70: app.get("/api/mlb/hr-board/today/deep", async (_req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbHrBoardRoutes.ts:88: app.get("/api/mlb/hr-board/date/:date", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbHrBoardRoutes.ts:97: app.get("/api/mlb/hr-board/player/:playerId", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/aiJudgeSocialRoutes.ts:11: app.get("/api/ai-judge-social/judges", (_req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/aiJudgeSocialRoutes.ts:19: app.post("/api/ai-judge-social/generate-hr-drafts", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/aiJudgeSocialRoutes.ts:41: app.get("/api/ai-judge-social/drafts", (_req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/aiJudgeSocialRoutes.ts:49: app.post("/api/ai-judge-social/drafts/:draftId/queue", (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/aiJudgeSocialRoutes.ts:60: app.post("/api/ai-judge-social/drafts/:draftId/mock-post", (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/index.ts:36: app.get("/api/skills", (_req: Request, res: Response) => res.json({ skills: listSkills() }));
CHECK_NO_AUTH_NEARBY: server/routes/index.ts:37: app.post("/api/skills/:id/run", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/index.ts:46: app.get("/api/system/core-health", (_req: Request, res: Response) =>
CHECK_NO_AUTH_NEARBY: server/routes/index.ts:59: app.get("/api/health", (_req: Request, res: Response) =>
CHECK_NO_AUTH_NEARBY: server/routes/trustRoutes.ts:7: app.get("/api/trust/user/:userId", (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/trustRoutes.ts:11: app.get("/api/trust/capper/:capperId", (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/agentRoutes.ts:7: app.get("/api/agents", (_req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/agentRoutes.ts:11: app.get("/api/agents/:id", (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/agentRoutes.ts:23: app.post("/api/agents/:id/generate-picks", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/agentRoutes.ts:44: app.post("/api/agents/generate-all-picks", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/aiRoutes.ts:9: app.post("/api/ai/explain-pick", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/aiRoutes.ts:15: app.post("/api/ai/daily-report", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/aiRoutes.ts:19: app.post("/api/ai/learning-note", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbMatchupRoutes.ts:6: app.get("/api/mlb/matchups/today", async (_req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbMatchupRoutes.ts:11: app.get("/api/mlb/matchups/date/:date", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/mlbMatchupRoutes.ts:16: app.get("/api/mlb/matchup/:gamePk", async (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/judgeRoutes.ts:8: app.post("/api/judge/pick", (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/judgeRoutes.ts:14: app.post("/api/judge/parlay", (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server/routes/judgeRoutes.ts:19: app.post("/api/judge/bias", (req: Request, res: Response) => {
CHECK_NO_AUTH_NEARBY: server.ts:25: app.post("/api/ai/chat", async (req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:72: app.post("/api/ai/generate-image", async (req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:127: app.post("/api/ai/generate-theme", async (req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:296: app.post("/api/ai/player-research", async (req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:422: app.post("/api/ai/parlay-edge", async (req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:543: app.get("/api/mlb/live", async (req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:946: app.get("/api/mlb/games/today", async (_req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:958: app.get("/api/mlb/games/date/:date", async (req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:970: app.get("/api/mlb/matchups/today", async (_req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:992: app.get("/api/mlb/matchup/:gamePk", async (req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:1014: app.get("/api/mlb/hr-board/today", async (_req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:1039: app.get("/api/mlb/hr-board/date/:date", async (req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:1062: app.get("/api/mlb/hr-board/player/:playerId", async (req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:1084: app.get("/api/mlb/reports/daily", async (req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:1113: app.get("/api/mlb/reports/vulnerable-pitchers", async (_req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:1121: app.get("/api/mlb/reports/hr-targets", async (_req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:1138: app.get("/api/mlb/reports/sneaky-hr", async (_req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:1146: app.get("/api/mlb/reports/run-environments", async (_req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:1162: app.get("/api/mlb/hr-feed/today", async (_req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:1177: app.get("*", (req, res) => {
CHECK_NO_AUTH_NEARBY: server.ts:1407: app.get('/api/mlb/daily-player-board', dailyPlayerBoardHandler);
CHECK_NO_AUTH_NEARBY: server.ts:1408: app.get('/api/mlb/lineup/today', dailyPlayerBoardHandler);
CHECK_NO_AUTH_NEARBY: server.ts:1409: app.get('/api/daily-players', dailyPlayerBoardHandler);
```

## 11. Frontend Secret Exposure Scan
```txt
No obvious frontend secret references found.
```

## 12. Env Names Present, Hidden
```txt
.env.local:26:VITE_API_BASE_URL=*** hidden ***
.env.local:27:SUPABASE_URL=*** hidden ***
.env.local:28:SUPABASE_ANON_KEY=*** hidden ***
.env.local:30:VITE_STRIPE_PUBLISHABLE_KEY=*** hidden ***
.env.local:31:VITE_SUPABASE_URL=*** hidden ***
.env.local:32:VITE_SUPABASE_ANON_KEY=*** hidden ***
```

## 13. Vite Watch / Backup Reload Risk
```txt
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const disableHmr = process.env.DISABLE_HMR === 'true';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['@supabase/supabase-js'],
    },
    server: {
      hmr: !disableHmr,
      proxy: {
        '/api/mlb/hr-board': {
          target: 'https://vouchres.vercel.app',
          changeOrigin: true,
          secure: true,
        },
      },
      watch: disableHmr
        ? null
        : {
            ignored: [
              '**/_code_backups/**',
              '**/_gemini_upload/**',
              '**/_gemini_clean_upload/**',
              '**/_vouchres_under_500mb/**',
              '**/*.before*.ts',
              '**/*.before*.tsx',
              '**/*.backup*.ts',
              '**/*.backup*.tsx',
              '**/*.save',
              '**/*.zip',
            ],
          },
    },
  };
});

Backup files still inside src/server:
server/services/share/hrShareCard.ts.backup
```

## 14. Known Enum Bug Scan
```txt
server/middleware/rateLimit.ts:7: * can exhaust the monthly AI budget in minutes. These limits sit in front of
server/services/billing/stripeService.ts:23:  [process.env.STRIPE_PRICE_GOLD ?? "price_gold_monthly"]: {
server/services/billing/stripeService.ts:25:    priceId: process.env.STRIPE_PRICE_GOLD ?? "price_gold_monthly",
server/services/billing/stripeService.ts:27:  [process.env.STRIPE_PRICE_SELLER_PRO ?? "price_seller_pro_monthly"]: {
server/services/billing/stripeService.ts:29:    priceId: process.env.STRIPE_PRICE_SELLER_PRO ?? "price_seller_pro_monthly",
src/components/Leaderboard.tsx:45:const SCOPE_MAP: Record<string, string> = { month: 'monthly', week: 'weekly', 'all-time': 'overall' };
src/components/SubscriberHub.tsx:42:  monthlyFee: number; // in credits
src/components/SubscriberHub.tsx:85:      { months: 1, name: 'Month-to-month', price: 50, savings: 'Standard Rate', note: 'Billed monthly. Cancel anytime.' },
src/components/SubscriberHub.tsx:101:      monthlyFee: 0,
src/components/SubscriberHub.tsx:112:      monthlyFee: 50,
src/components/SubscriberHub.tsx:123:      monthlyFee: 80,
```

## 15. Package Scripts / Dependencies
```txt
{
  "name": "vouchedge",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs && esbuild server/cron/dailyGradeJob.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/gradeJob.cjs && esbuild server/cron/dailyDeleteJob.ts --bundle --platform=node --format=cjs --packages=external --external:stripe --external:../middleware/auth --outfile=dist/deleteJob.cjs",
    "start": "node dist/server.cjs",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@sentry/node": "^10.61.0",
    "@sentry/react": "^10.61.0",
    "@supabase/supabase-js": "^2.108.2",
    "@vercel/speed-insights": "^2.0.0",
    "@vitejs/plugin-react": "^5.0.4",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "express-rate-limit": "^8.5.2",
    "framer-motion": "^12.42.0",
    "helmet": "^8.2.0",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "node-cron": "^4.5.0",
    "posthog-js": "^1.393.5",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "recharts": "^3.8.1",
    "stripe": "^22.3.0",
    "vite": "^6.2.3",
    "vitest": "^4.1.9",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.1",
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "@types/node-cron": "^3.0.11",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vercel/node": "^5.8.21",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "react-refresh": "^0.18.0",
    "tailwindcss": "^4.1.14",
    "tsx": "^4.21.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.3"
  }
}
```

