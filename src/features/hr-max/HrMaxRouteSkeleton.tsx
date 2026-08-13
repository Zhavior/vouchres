import './hr-max-desk.css';

export default function HrMaxRouteSkeleton() {
  return (
    <div className="hr-max-skeleton" aria-busy="true" aria-label="Loading HR Command Desk">
      <div className="hr-max-skeleton__block" />
      <div className="hr-max-skeleton__block hr-max-skeleton__hero" />
      <div className="hr-max-skeleton__block hr-max-skeleton__hero" />
      <div className="hr-max-skeleton__block" />
    </div>
  );
}
