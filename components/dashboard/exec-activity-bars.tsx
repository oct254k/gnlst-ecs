interface ExecCount {
  id: string
  name: string
  color: string | null
  title: string
  count: number
}

interface ExecActivityBarsProps {
  execCounts: ExecCount[]
  weekLabel: string
}

export function ExecActivityBars({ execCounts, weekLabel }: ExecActivityBarsProps) {
  const max = Math.max(1, ...execCounts.map((c) => c.count))

  return (
    <div className="card" style={{ gridColumn: 'span 3' }}>
      <div className="card-hd">
        <span className="card-hd-title">
          이번 주 임원별 일정 분포
        </span>
        <span className="card-hd-meta">{weekLabel}</span>
      </div>
      <div className="card-bd">
        <div className="exec-bars">
          {execCounts.map((c) => (
            <div key={c.id} className="exec-bar-row">
              <div className="exec-bar-name">
                <span
                  className="color-dot color-dot-lg"
                  style={{ background: c.color ?? undefined }}
                />
                <span className="fw-6">{c.name}</span>
                <span className="muted text-sm">{c.title}</span>
              </div>
              <div className="exec-bar-track">
                <div
                  className="exec-bar-fill"
                  style={{
                    width: `${(c.count / max) * 100}%`,
                    background: c.color ?? undefined,
                  }}
                >
                  <span className="exec-bar-num">{c.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
