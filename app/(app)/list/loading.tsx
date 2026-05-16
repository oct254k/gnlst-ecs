export default function Loading() {
  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="skeleton" style={{ width: 240, height: 36, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 8, marginLeft: 'auto' }} />
      </div>
      <div className="skeleton" style={{ height: 48, borderRadius: 8, marginBottom: 2 }} />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 52, borderRadius: 0, marginBottom: 1, opacity: 1 - i * 0.08 }} />
      ))}
    </div>
  )
}
