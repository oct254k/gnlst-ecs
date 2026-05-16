import { Suspense } from 'react'
import { Shell } from '@/components/layout/shell'
import { ScheduleModalsHost } from '@/components/schedule/schedule-modals-host'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      {children}
      <Suspense>
        <ScheduleModalsHost />
      </Suspense>
    </Shell>
  )
}
