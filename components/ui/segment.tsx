'use client'

interface SegmentOption {
  value: string
  label: string
  disabled?: boolean
}

interface SegmentProps {
  value: string
  onChange: (value: string) => void
  options: SegmentOption[]
}

export function Segment({ value, onChange, options }: SegmentProps) {
  return (
    <div className="segment" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          className={`segment-btn ${value === o.value ? 'on' : ''}`}
          onClick={() => onChange(o.value)}
          disabled={o.disabled}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
