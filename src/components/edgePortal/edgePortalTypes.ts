import type { ComponentType } from 'react';

export type EdgePortalGroup = 'today' | 'build' | 'proof' | 'pro' | 'system';

export type EdgePortalFeature = {
  id: string;
  title: string;
  eyebrow?: string;
  subtitle: string;
  section: string;
  group: EdgePortalGroup;
  badge?: string;
  requiresPro?: boolean;
  enabled?: boolean;
  priority: number;
  icon?: ComponentType<{ className?: string }>;
};

export type EdgeAiProviderId = 'none' | 'openai' | 'gemini' | 'anthropic' | 'zai' | 'local';

export type EdgeAiToolId =
  | 'summarize_today'
  | 'explain_page'
  | 'open_feature'
  | 'build_parlay_plan'
  | 'analyze_player'
  | 'explain_results'
  | 'upgrade_pitch';

export type EdgeAiTool = {
  id: EdgeAiToolId;
  title: string;
  description: string;
  group: EdgePortalGroup;
  enabled: boolean;
  requiresPro?: boolean;
  safeActionOnly?: boolean;
};
