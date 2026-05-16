type BadgeTone = 'primary' | 'accent' | 'neutral' | 'success' | 'warn' | 'danger' | 'info'

interface BadgeProps {
  tone?: BadgeTone
  dot?: boolean
  children: React.ReactNode
}

export function Badge({ tone = 'neutral', dot, children }: BadgeProps) {
  return (
    <span className={`badge badge-${tone} ${dot ? 'badge-dot' : ''}`}>
      {children}
    </span>
  )
}
