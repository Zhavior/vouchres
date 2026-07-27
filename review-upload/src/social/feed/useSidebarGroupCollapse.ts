import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'vouchedge_sidebar_collapsed_groups_v1';

const DEFAULT_COLLAPSED: Record<string, boolean> = {
  Daily: false,
  'Pro Labs': true,
  AI: true,
  'Build & Track': true,
  Social: true,
  Account: true,
};

function loadCollapsedGroups(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_COLLAPSED };
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return { ...DEFAULT_COLLAPSED, ...parsed };
  } catch {
    return { ...DEFAULT_COLLAPSED };
  }
}

function persistCollapsedGroups(groups: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch {
    // ignore quota / private mode
  }
}

/** Shared collapse state for desktop sidebar + mobile drawer nav groups. */
export function useSidebarGroupCollapse(activeSection: string, sectionIdsByGroup: Map<string, string[]>) {
  const [collapsedGroups, setCollapsedGroups] = useState(loadCollapsedGroups);

  useEffect(() => {
    for (const [group, ids] of sectionIdsByGroup) {
      if (!ids.includes(activeSection)) continue;
      setCollapsedGroups((prev) => {
        if (!prev[group]) return prev;
        const next = { ...prev, [group]: false };
        persistCollapsedGroups(next);
        return next;
      });
      break;
    }
  }, [activeSection, sectionIdsByGroup]);

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [group]: !prev[group] };
      persistCollapsedGroups(next);
      return next;
    });
  }, []);

  const isCollapsed = useCallback(
    (group: string) => collapsedGroups[group] ?? DEFAULT_COLLAPSED[group] ?? false,
    [collapsedGroups],
  );

  return { isCollapsed, toggleGroup };
}
