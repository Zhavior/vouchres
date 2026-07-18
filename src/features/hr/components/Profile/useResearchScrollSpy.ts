import { useCallback, useEffect, useRef, useState } from 'react';

export type ResearchSectionId = 'overview' | 'layers' | 'bvp' | 'team' | 'form';

const SECTION_IDS: ResearchSectionId[] = ['overview', 'layers', 'bvp', 'team', 'form'];

/**
 * Scroll-spy for the one-page HR research dossier.
 * Sidebar/nav jumps scroll the content pane; IntersectionObserver keeps the active item in sync.
 */
export function useResearchScrollSpy(isOpen: boolean, resetKey: string | number | null | undefined) {
  const [activeSection, setActiveSection] = useState<ResearchSectionId>('overview');
  const contentRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Partial<Record<ResearchSectionId, HTMLElement | null>>>({});
  const scrollingProgrammatically = useRef(false);
  const refCallbacks = useRef<Partial<Record<ResearchSectionId, (node: HTMLElement | null) => void>>>({});

  const setSectionRef = useCallback((id: ResearchSectionId) => {
    if (!refCallbacks.current[id]) {
      refCallbacks.current[id] = (node: HTMLElement | null) => {
        sectionRefs.current[id] = node;
      };
    }
    return refCallbacks.current[id]!;
  }, []);

  const scrollToSection = useCallback((id: ResearchSectionId) => {
    const el = sectionRefs.current[id] ?? contentRef.current?.querySelector(`[data-research-section="${id}"]`);
    if (!(el instanceof HTMLElement)) {
      setActiveSection(id);
      return;
    }
    scrollingProgrammatically.current = true;
    setActiveSection(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      scrollingProgrammatically.current = false;
    }, 500);
  }, []);

  useEffect(() => {
    if (isOpen) setActiveSection('overview');
  }, [isOpen, resetKey]);

  useEffect(() => {
    if (!isOpen) return;
    const root = contentRef.current;
    if (!root) return;

    let observer: IntersectionObserver | null = null;

    const connect = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          if (scrollingProgrammatically.current) return;
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          const top = visible[0]?.target.getAttribute('data-research-section') as ResearchSectionId | null;
          if (top && SECTION_IDS.includes(top)) setActiveSection(top);
        },
        {
          root,
          rootMargin: '-10% 0px -55% 0px',
          threshold: [0.12, 0.3, 0.5],
        },
      );

      for (const id of SECTION_IDS) {
        const el =
          sectionRefs.current[id] ??
          root.querySelector(`[data-research-section="${id}"]`);
        if (el) observer.observe(el);
      }
    };

    connect();
    const raf = window.requestAnimationFrame(connect);
    const timer = window.setTimeout(connect, 120);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [isOpen, resetKey]);

  return { activeSection, contentRef, setSectionRef, scrollToSection };
}
