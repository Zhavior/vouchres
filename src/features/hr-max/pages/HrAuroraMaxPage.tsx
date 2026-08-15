import HrMaxDesk from '../components/HrMaxDesk';
import '../hr-max-desk.css';

export default function HrAuroraMaxPage({ onNavigate }: { onNavigate?: (section: string) => void }) {
  return <HrMaxDesk onNavigate={onNavigate} />;
}
