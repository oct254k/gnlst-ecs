'use client'

import type { RadarExec } from './radar-view'

interface ExecSelectorProps {
  execs: RadarExec[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
}

export function ExecSelector({ execs, selected, onChange }: ExecSelectorProps) {
  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  function toggleAll() {
    if (selected.size === execs.length) onChange(new Set())
    else onChange(new Set(execs.map((e) => e.id)))
  }

  return (
    <div style={{ maxHeight: 280, overflowY: 'auto' }}>
      <label
        className="layer-row"
        style={{ padding: '10px 14px', borderBottom: '1px solid var(--c-divider)', cursor: 'pointer' }}
      >
        <input
          type="checkbox"
          className="cb"
          checked={selected.size === execs.length}
          onChange={toggleAll}
        />
        <span className="fw-6">전체 선택</span>
      </label>

      {execs.map((exec) => (
        <label
          key={exec.id}
          className="layer-row"
          style={{ padding: '8px 14px', cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            className="cb"
            checked={selected.has(exec.id)}
            onChange={() => toggle(exec.id)}
          />
          <span
            className="color-dot color-dot-lg"
            style={{ background: exec.color }}
          />
          <span className="layer-name">{exec.name}</span>
          <span className="muted text-sm">{exec.title}</span>
        </label>
      ))}
    </div>
  )
}
