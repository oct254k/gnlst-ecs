export default function Loading() {
  return (
    <div style={{ padding: '24px 32px' }}>
      <div className="skeleton" style={{ width: 160, height: 24, marginBottom: 20, borderRadius: 6 }} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ width: 80, height: 32, borderRadius: 20 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 480, borderRadius: 12 }} />
    </div>
  )
}
