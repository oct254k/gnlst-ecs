export default function Loading() {
  return (
    <div style={{ padding: '24px 32px' }}>
      <div className="skeleton" style={{ width: 120, height: 24, marginBottom: 20, borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 48, borderRadius: 8, marginBottom: 2 }} />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 52, borderRadius: 0, marginBottom: 1, opacity: 1 - i * 0.08 }} />
      ))}
    </div>
  )
}
