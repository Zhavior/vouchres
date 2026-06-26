import React, { createContext, useContext, useState, useEffect } from 'react';
import { CreatorProofProfile } from '../../types';
import { THEME_REGISTRY, BORDER_REGISTRY, VisualTheme, ProfileBorder } from '../../theme/themeRegistry';

interface ThemeContextType {
  currentAppTheme: VisualTheme;
  currentProfileTheme: VisualTheme;
  currentBorder: ProfileBorder | null;
  activeTheme: VisualTheme; // Automatically falls back to override if view is active
  overrideTheme: VisualTheme | null;
  setAppTheme: (themeId: string) => void;
  setProfileTheme: (themeId: string) => void;
  setBorder: (borderId: string | null) => void;
  setOverrideTheme: (themeId: string | null) => void;
  unlockedThemes: string[];
  unlockedBorders: string[];
  unlockTheme: (themeId: string) => void;
  unlockBorder: (borderId: string) => void;
  reduceMotion: boolean;
  setReduceMotion: (val: boolean) => void;
  userCredits: number;
  setUserCredits: (val: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Converts a hex like #00B7FF to an rgba() string at the given alpha.
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Resolves a theme's accent + glow colors from its `accentText` token.
// Handles arbitrary hex (text-[#00B7FF]) and common Tailwind color names so that
// every theme — including the premium set — glows in its own color.
function resolveThemeAccent(accentText: string): { accent: string; glow: string } {
  const hexMatch = accentText.match(/#([0-9a-fA-F]{3,8})/);
  if (hexMatch) {
    const hex = `#${hexMatch[1]}`;
    return { accent: hex, glow: hexToRgba(hex, 0.32) };
  }
  // token -> [accentHex, glowRgba]
  const map: Record<string, [string, string]> = {
    cyan: ['#22d3ee', 'rgba(34,211,238,0.3)'],
    sky: ['#7dd3fc', 'rgba(125,211,252,0.3)'],
    blue: ['#3b82f6', 'rgba(59,130,246,0.3)'],
    indigo: ['#6366f1', 'rgba(99,102,241,0.3)'],
    violet: ['#a78bfa', 'rgba(167,139,250,0.32)'],
    purple: ['#a855f7', 'rgba(168,85,247,0.3)'],
    fuchsia: ['#e879f9', 'rgba(232,121,249,0.3)'],
    pink: ['#f472b6', 'rgba(244,114,182,0.3)'],
    rose: ['#e11d48', 'rgba(225,29,72,0.3)'],
    red: ['#ef4444', 'rgba(239,68,68,0.3)'],
    orange: ['#f97316', 'rgba(249,115,22,0.3)'],
    amber: ['#f59e0b', 'rgba(245,158,11,0.32)'],
    yellow: ['#facc15', 'rgba(250,204,21,0.3)'],
    lime: ['#a3e635', 'rgba(163,230,53,0.3)'],
    green: ['#4ade80', 'rgba(74,222,128,0.3)'],
    emerald: ['#10b981', 'rgba(16,185,129,0.3)'],
    teal: ['#14b8a6', 'rgba(20,184,166,0.3)'],
    slate: ['#e2e8f0', 'rgba(226,232,240,0.25)'],
    white: ['#ffffff', 'rgba(255,255,255,0.25)'],
  };
  for (const token of Object.keys(map)) {
    if (accentText.includes(token)) {
      return { accent: map[token][0], glow: map[token][1] };
    }
  }
  return { accent: '#22d3ee', glow: 'rgba(34,211,238,0.3)' };
}

interface ThemeProviderProps {
  profile: CreatorProofProfile;
  onUpdateProfile: (updates: Partial<CreatorProofProfile>) => void;
  children: React.ReactNode;
}

export function ThemeProvider({ profile, onUpdateProfile, children }: ThemeProviderProps) {
  const [overrideThemeId, setOverrideThemeId] = useState<string | null>(null);
  
  // Manage user credits in localStorage
  const [userCredits, setUserCreditsState] = useState<number>(() => {
    const cached = localStorage.getItem('vouchedge_theme_credits');
    if (cached) return parseInt(cached, 10);
    localStorage.setItem('vouchedge_theme_credits', '1000');
    return 1000;
  });

  const setUserCredits = (val: number) => {
    setUserCreditsState(val);
    localStorage.setItem('vouchedge_theme_credits', val.toString());
  };

  // Sync unlocked lists with legacy fields to prevent any data loss
  const unlockedThemes = profile.unlockedThemeIds || profile.boughtThemes || ['cyber-blue', '4bit-arcade', 'proof-mode'];
  const unlockedBorders = profile.unlockedBorderIds || ['default-cyber-ring'];

  // Resolve Themes
  const currentAppTheme = THEME_REGISTRY.find(t => t.id === (profile.appThemeId || profile.activeTheme)) || THEME_REGISTRY[0];
  const currentProfileTheme = THEME_REGISTRY.find(t => t.id === profile.profileThemeId) || currentAppTheme;
  const currentBorder = BORDER_REGISTRY.find(b => b.id === profile.profileBorderId) || BORDER_REGISTRY[0];

  // Resolve Active Theme
  const overrideTheme = overrideThemeId ? (THEME_REGISTRY.find(t => t.id === overrideThemeId) || null) : null;
  const activeTheme = overrideTheme || currentAppTheme;

  const setAppTheme = (themeId: string) => {
    onUpdateProfile({ 
      appThemeId: themeId,
      activeTheme: themeId // Maintain backward compatibility
    });
  };

  const setProfileTheme = (themeId: string) => {
    onUpdateProfile({ profileThemeId: themeId });
  };

  const setBorder = (borderId: string | null) => {
    onUpdateProfile({ profileBorderId: borderId || undefined });
  };

  const setOverrideTheme = (themeId: string | null) => {
    setOverrideThemeId(themeId);
  };

  const unlockTheme = (themeId: string) => {
    if (!unlockedThemes.includes(themeId)) {
      const nextThemes = [...unlockedThemes, themeId];
      onUpdateProfile({ 
        unlockedThemeIds: nextThemes,
        boughtThemes: nextThemes // Keep synced for backward compatibility
      });
    }
  };

  const unlockBorder = (borderId: string) => {
    if (!unlockedBorders.includes(borderId)) {
      onUpdateProfile({ unlockedBorderIds: [...unlockedBorders, borderId] });
    }
  };

  const reduceMotion = !!profile.reduceMotion;
  const setReduceMotion = (val: boolean) => {
    onUpdateProfile({ reduceMotion: val });
  };

  // Add styles to document based on active theme
  useEffect(() => {
    const root = document.documentElement;
    // Set fontFamily
    if (activeTheme.fontFamily === 'font-mono') {
      root.style.fontFamily = '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace';
    } else {
      root.style.fontFamily = '"Inter", ui-sans-serif, system-ui, sans-serif';
    }

    // Resolve the theme's true accent + glow color from its accentText token.
    // Supports Tailwind color names AND arbitrary hex tokens (e.g. text-[#00B7FF]),
    // so every premium theme glows in its own color instead of a yellow fallback.
    const { accent, glow } = resolveThemeAccent(activeTheme.accentText);
    root.style.setProperty('--theme-accent-color', accent);
    root.style.setProperty('--theme-border-color', activeTheme.borderColor || 'rgba(6,182,212,0.2)');
    root.style.setProperty('--theme-glow-color', glow);
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{
      currentAppTheme,
      currentProfileTheme,
      currentBorder,
      activeTheme,
      overrideTheme,
      setAppTheme,
      setProfileTheme,
      setBorder,
      setOverrideTheme,
      unlockedThemes,
      unlockedBorders,
      unlockTheme,
      unlockBorder,
      reduceMotion,
      setReduceMotion,
      userCredits,
      setUserCredits
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
