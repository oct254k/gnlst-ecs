'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { Footer } from './footer'
import { NotificationPopover } from '@/components/notifications/notification-popover'
import { createBrowserClientInstance } from '@/app/_lib/supabase/client'
import type { UserRole } from '@/lib/types'

type Theme = 'light' | 'dark'
type Accent = 'navy' | 'red' | 'slate' | 'teal'
type Density = 'compact' | 'normal' | 'comfortable'

interface ThemeSettings {
  theme: Theme
  accent: Accent
  density: Density
}

interface CurrentUser {
  name: string
  color: string
  role: UserRole
}

const DEFAULT_SETTINGS: ThemeSettings = {
  theme: 'light',
  accent: 'navy',
  density: 'normal',
}

function loadSettings(): ThemeSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem('gnlst-theme')
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {}
  return DEFAULT_SETTINGS
}

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS)
  const [notifOpen, setNotifOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const handleCreateSchedule = useCallback(
    (type: 'personal' | 'common') => {
      router.push(`${pathname}?modal=form&type=${type}`)
    },
    [router, pathname]
  )

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  useEffect(() => {
    localStorage.setItem('gnlst-theme', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    async function fetchUserAndNotifs() {
      const supabase = createBrowserClientInstance()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('name, role, color')
          .eq('id', user.id)
          .single()
        if (data) {
          setCurrentUser({
            name: (data as { name: string; role: string; color: string | null }).name,
            role: (data as { name: string; role: string; color: string | null }).role as UserRole,
            color: (data as { name: string; role: string; color: string | null }).color ?? '#475569',
          })
        }
      }
      try {
        const notifRes = await fetch('/api/notifications?status=unread&per_page=1')
        const notifJson = await notifRes.json()
        setUnreadCount(notifJson.meta?.unread_count ?? 0)
      } catch {
        // 알림 fetch 실패 시 무시
      }
    }
    fetchUserAndNotifs()
  }, [])

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 900) {
      setMobileSidebarOpen(s => !s)
    } else {
      setSidebarCollapsed(s => !s)
    }
  }

  return (
    <div
      className="app"
      data-theme={settings.theme}
      data-accent={settings.accent}
      data-density={settings.density}
      data-sidebar={sidebarCollapsed ? 'collapsed' : 'expanded'}
      data-mobile-sidebar={mobileSidebarOpen ? 'open' : 'closed'}
    >
      <div className="app-header" style={{ position: 'relative' }}>
        <Header
          onToggleSidebar={handleToggleSidebar}
          onShowNotif={() => setNotifOpen(o => !o)}
          onCreateSchedule={() => handleCreateSchedule('personal')}
          unreadCount={unreadCount}
          userName={currentUser?.name ?? '관리자'}
          userColor={currentUser?.color ?? '#475569'}
          userRole={currentUser?.role ?? 'admin'}
        />
        <div style={{ position: 'absolute', top: 0, right: 0, height: '100%' }}>
          <NotificationPopover open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
      </div>

      <Sidebar isAdmin={currentUser?.role === 'admin'} onCreateSchedule={handleCreateSchedule} />

      <main className="app-main">
        <div className="main" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="main-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </div>
          <Footer />
        </div>
      </main>
    </div>
  )
}
