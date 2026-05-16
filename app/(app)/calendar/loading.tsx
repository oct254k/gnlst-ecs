export default function Loading() {
  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 160, height: 36, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 8 }} />
      </div>
      <div className="skeleton" style={{ height: 560, borderRadius: 12 }} />
    </div>
  )
}
