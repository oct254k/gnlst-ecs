'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'

const crumbs: Record<string, string> = {
  '/dashboard':      '대시보드',
  '/calendar':       '일정 > 달력',
  '/list':           '일정 > 리스트',
  '/radar':          '협업 > 모임 레이더',
  '/notifications':  '알림',
  '/contacts':       '데이터 > 연락처·회사',
  '/admin/users':    '관리자 > 사용자 관리',
  '/admin/proxy':    '관리자 > 대리권한 관리',
  '/admin/holiday':  '관리자 > 공휴일 관리',
  '/admin/notif':    '관리자 > 알림 발송 이력',
  '/my':             '마이 페이지',
}

interface HeaderProps {
  onToggleSidebar: () => void
  onShowNotif?: () => void
  onCreateSchedule?: () => void
  unreadCount?: number
  userName?: string
  userColor?: string
  userRole?: 'admin' | 'user'
  userType?: string
}

export function Header({
  onToggleSidebar,
  onShowNotif,
  onCreateSchedule,
  unreadCount = 0,
  userName = '관리자',
  userColor = '#475569',
  userRole = 'admin',
  userType = 'exec',
}: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const crumb = crumbs[pathname] ?? '대시보드'

  return (
    <header className="hd">
      <div className="hd-brand">
        <button className="hd-toggle" onClick={onToggleSidebar} aria-label="사이드바 토글">
          <Icon name="menu" />
        </button>
        <div
          style={{ cursor: 'default' }}
          onClick={() => router.push('/dashboard')}
        >
          <div className="hd-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gnlst-logo.png" alt="GNLST" className="hd-logo-img gnlst-logo-img" />
            <span className="hd-logo-text">임원 일정관리</span>
          </div>
        </div>
      </div>

      <div className="hd-center">
        <div className="hd-crumb">
          <span>GNLST</span>
          <span className="sep">/</span>
          <b>{crumb}</b>
        </div>
      </div>

      <div className="hd-actions">
        <button
          className="hd-action"
          title="새 일정 등록"
          onClick={onCreateSchedule}
        >
          <Icon name="plus" size={14} /> 일정 등록
        </button>
        <div style={{ width: 1, background: 'var(--c-divider)', margin: '8px 4px' }} />
        <button
          className="hd-action"
          title="알림"
          onClick={onShowNotif}
          aria-label={`알림 ${unreadCount}건`}
        >
          <Icon name="bell" />
          {unreadCount > 0 && (
            <span className="badge-dot">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>
        <div
          className="hd-user"
          onClick={() => router.push('/my')}
          style={{ cursor: 'default' }}
        >
          <div className="hd-user-avatar" style={{ background: userColor }}>
            {userName.charAt(0)}
          </div>
          <div className="hd-user-info">
            <div className="hd-user-name">{userName}</div>
            <div className="hd-user-role">
              {userRole === 'admin' ? '관리자' : userType === 'staff' ? '직원' : '임원'}
            </div>
          </div>
          <Icon name="chevD" size={12} stroke="var(--c-hd-text-soft)" />
        </div>
      </div>
    </header>
  )
}
