export default function AuroraHqRouteSkeleton() {
  return (
    <div className="aurora-hq__skeleton">
      <div className="aurora-hq__hold aurora-hq__hold--hero" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '0.75rem' }}>
        <div className="aurora-hq__hold" style={{ minHeight: '14rem' }} />
        <div className="aurora-hq__hold" style={{ minHeight: '14rem' }} />
      </div>
      <div className="aurora-hq__hold" />
      <div className="aurora-hq__hold" />
    </div>
  );
}
