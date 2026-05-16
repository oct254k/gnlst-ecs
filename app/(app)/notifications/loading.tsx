export default function Loading() {
  return (
    <div style={{ padding: '24px 32px' }}>
      <div className="skeleton" style={{ width: 100, height: 24, marginBottom: 20, borderRadius: 6 }} />
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 16, borderRadius: 4, marginBottom: 6, width: '60%' }} />
            <div className="skeleton" style={{ height: 14, borderRadius: 4, width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
