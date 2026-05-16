'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'

interface NavItem {
  id: string
  path: string
  icon: Parameters<typeof Icon>[0]['name']
  label: string
  count?: number
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  // 일정
  { id: 'dashboard',  path: '/dashboard',     icon: 'dashboard', label: '대시보드' },
  { id: 'calendar',   path: '/calendar',      icon: 'cal',       label: '달력' },
  { id: 'list',       path: '/list',          icon: 'list',      label: '리스트' },
  // 협업
  { id: 'radar',      path: '/radar',         icon: 'radar',     label: '모임 레이더' },
  { id: 'notif',      path: '/notifications', icon: 'bell',      label: '알림' },
  // 데이터 (admin)
  { id: 'contacts',   path: '/contacts',      icon: 'contact',   label: '연락처·회사', adminOnly: true },
  // 관리자
  { id: 'au',         path: '/admin/users',   icon: 'users',     label: '사용자 관리', adminOnly: true },
  { id: 'ap',         path: '/admin/proxy',   icon: 'shield',    label: '대리권한 관리', adminOnly: true },
  { id: 'ah',         path: '/admin/holiday', icon: 'holiday',   label: '공휴일 관리', adminOnly: true },
  { id: 'an',         path: '/admin/notif',   icon: 'notif_log', label: '알림 발송 이력', adminOnly: true },
]

interface SidebarProps {
  isAdmin?: boolean
  unreadCount?: number
  onCreateSchedule?: (type: 'personal' | 'common') => void
}

export function Sidebar({ isAdmin = false, unreadCount = 0, onCreateSchedule }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const scheduleItems = navItems.filter(i => ['dashboard', 'calendar', 'list'].includes(i.id))
  const colabItems = navItems.filter(i => ['radar', 'notif'].includes(i.id))
  const dataItems = navItems.filter(i => i.adminOnly && ['contacts'].includes(i.id))
  const adminItems = navItems.filter(i => i.adminOnly && ['au', 'ap', 'ah', 'an'].includes(i.id))

  const SbItem = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
    const count = item.id === 'notif' ? (unreadCount > 0 ? unreadCount : undefined) : item.count
    return (
      <div
        className={`sb-item ${isActive ? 'active' : ''}`}
        onClick={() => router.push(item.path)}
      >
        <span className="ico"><Icon name={item.icon} /></span>
        <span className="lbl">{item.label}</span>
        {count != null && <span className="cnt">{count}</span>}
      </div>
    )
  }

  return (
    <aside className="sb app-sidebar">
      <div className="sb-scroll">
        <div className="sb-group">
          <div className="sb-group-title">일정</div>
          {scheduleItems.map(i => <SbItem key={i.id} item={i} />)}
        </div>
        <div className="sb-group">
          <div className="sb-group-title">협업</div>
          {colabItems.map(i => <SbItem key={i.id} item={i} />)}
        </div>
        {isAdmin && (
          <div className="sb-group">
            <div className="sb-group-title">데이터</div>
            {dataItems.map(i => <SbItem key={i.id} item={i} />)}
          </div>
        )}
        {isAdmin && (
          <div className="sb-group">
            <div className="sb-group-title">관리자</div>
            {adminItems.map(i => <SbItem key={i.id} item={i} />)}
          </div>
        )}
      </div>
      <div className="sb-quick">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onCreateSchedule?.('personal')}
        >
          <Icon name="plus" size={12} /> <span className="lbl">일정 등록</span>
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onCreateSchedule?.('common')}
        >
          <Icon name="plus" size={12} /> <span className="lbl">공통 일정</span>
        </button>
        {isAdmin && (
          <button
            className="btn btn-tertiary btn-sm"
            onClick={() => router.push('/admin/users')}
          >
            <Icon name="users" size={12} /> <span className="lbl">사용자 초대</span>
          </button>
        )}
      </div>
    </aside>
  )
}
