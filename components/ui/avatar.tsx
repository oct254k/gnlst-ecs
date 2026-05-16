interface User {
  name: string
  color?: string
}

interface AvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ user, size = 'md' }: AvatarProps) {
  const cls = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : ''
  return (
    <span
      className={`avatar ${cls}`}
      style={{ background: user.color ?? 'var(--c-text-3)' }}
    >
      {user.name.charAt(0)}
    </span>
  )
}
