import { LiveGamesNextShell } from '../components/LiveGamesNextShell';
import type { MLBPlayer } from '../../../types';

export interface LiveGamesNextPageProps {
  onAddLegToParlay: (player: MLBPlayer, prop: { id: string; market: string; odds: number | null; spec: string }) => void;
}

export function LiveGamesNextPage({ onAddLegToParlay }: LiveGamesNextPageProps) {
  return (
    <main className="ve-page-shell flex flex-col h-full w-full overflow-hidden">
      <LiveGamesNextShell onAddLegToParlay={onAddLegToParlay} />
    </main>
  );
}

export default LiveGamesNextPage;
