const AURORA_PAGES = [
  { id: 'aurora_hr_hq', label: 'Aurora HQ' },
  { id: 'aurora_daily_slate', label: 'Daily Slate' },
] as const;

export function AuroraHqHeaderNav({
  activeSection,
  onNavigate,
}: {
  activeSection: string;
  onNavigate: (section: string) => void;
}) {
  return (
    <nav className="aurora-hq__page-nav" aria-label="Aurora pages">
      {AURORA_PAGES.map((page) => {
        const isActive = activeSection === page.id;
        return (
          <button
            key={page.id}
            type="button"
            className={`aurora-hq__page-tab${isActive ? ' is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (!isActive) onNavigate(page.id);
            }}
          >
            {page.label}
          </button>
        );
      })}
    </nav>
  );
}
