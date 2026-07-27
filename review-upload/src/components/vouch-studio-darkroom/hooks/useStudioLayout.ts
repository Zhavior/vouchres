import { useEffect, useState } from 'react';

export function useStudioLayout() {
  const [mobileStudioView, setMobileStudioView] = useState<'preview' | 'edit'>('preview');
  const [isCompactStudio, setIsCompactStudio] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsCompactStudio(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const showControlsPanel = !isCompactStudio || mobileStudioView === 'edit';
  const showPreviewPanel = !isCompactStudio || mobileStudioView === 'preview';

  return {
    mobileStudioView,
    setMobileStudioView,
    isCompactStudio,
    showControlsPanel,
    showPreviewPanel,
  };
}
