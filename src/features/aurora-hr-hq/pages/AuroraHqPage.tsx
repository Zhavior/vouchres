import AuroraHqDesk, { type AuroraHqSurface } from '../components/AuroraHqDesk';

export default function AuroraHqPage({
  surface = 'desk',
  onNavigate,
}: {
  surface?: AuroraHqSurface;
  onNavigate: (section: string) => void;
}) {
  return <AuroraHqDesk surface={surface} onNavigate={onNavigate} />;
}
