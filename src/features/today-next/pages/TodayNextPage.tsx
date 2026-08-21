import { useEffect } from 'react';
import { TodayNextShell } from '../components/TodayNextShell';

interface TodayNextPageProps {
  navigateSection?: (section: string) => void;
}

export function TodayNextPage({ navigateSection }: TodayNextPageProps) {
  useEffect(() => {
    document.title = "Today's Command Desk — VouchEdge";
  }, []);

  return (
    // overflow-x-clip, not overflow-hidden: `hidden` would make this a scroll
    // container, which breaks the shell's sticky header against document
    // scroll. `clip` still contains horizontal overflow.
    //
    // No background here on purpose. An opaque fill at this level paints over
    // the fixed 3D layer and hides the animation entirely; the app shell owns
    // the base colour.
    <main
      className="ve-page-shell flex min-h-full w-full flex-col overflow-x-clip"
      data-performance-page="today"
    >
      <TodayNextShell navigateSection={navigateSection} />
    </main>
  );
}

export default TodayNextPage;
