import { useEffect } from 'react';
import { TodayNextShell } from '../components/TodayNextShell';

interface TodayCommandPageProps {
  navigateSection?: (section: string) => void;
}

/**
 * The replacement Today route. The visual command desk remains familiar, but
 * its shell mounts independently from every remote data source.
 */
export function TodayCommandPage({ navigateSection }: TodayCommandPageProps) {
  useEffect(() => {
    document.title = "Today's Command Desk — VouchEdge";
  }, []);

  return (
    <main
      className="ve-page-shell flex min-h-full w-full min-w-0 flex-col overflow-x-clip break-words"
      data-performance-page="today"
      data-today-architecture="progressive-v2"
    >
      <TodayNextShell navigateSection={navigateSection} />
    </main>
  );
}

export default TodayCommandPage;
