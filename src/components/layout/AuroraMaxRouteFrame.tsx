import type { ReactNode } from 'react';

const DENSE_ROUTES = new Set(['today', 'hr_board', 'daily_hr_watch_new', 'hr_aurora_max', 'intel', 'feed', 'live_games']);
const FOCUSED_ROUTES = new Set(['settings', 'profile', 'premium', 'customize', 'notifications']);

export default function AuroraMaxRouteFrame({ section, children }: { section: string; children: ReactNode }) {
  const mode = DENSE_ROUTES.has(section) ? 'dense' : FOCUSED_ROUTES.has(section) ? 'focused' : 'workspace';

  return (
    <div
      className={`aurora-max-route-frame aurora-max-route-frame--${mode}`}
      data-aurora-route={section}
      data-aurora-density={mode}
    >
      {children}
    </div>
  );
}
