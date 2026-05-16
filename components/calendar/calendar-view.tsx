'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { CalendarSchedule } from '@/lib/types'
import type { Holiday } from '@/lib/types'
import type { MockUser } from './mock-data'
import { Segment } from '@/components/ui/segment'
import { Icon } from '@/components/ui/icon'
import { MonthView } from './month-view'
import { WeekView } from './week-view'
import { DayView } from './day-view'
import { CalendarAside } from './calendar-aside'
import {
  navigateDate,
  formatMonthTitle,
  formatWeekTitle,
  formatDayTitle,
} from './calendar-helpers'

type ViewType = 'month' | 'week' | 'day'

interface CalendarViewProps {
  users: MockUser[]
  schedules: CalendarSchedule[]
  holidays: Holiday[]
  today: string
  initialView: ViewType
  initialDate: string
}

export function CalendarView({
  users,
  schedules,
  holidays,
  today,
  initialView,
  initialDate,
}: CalendarViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [view, setView] = useState<ViewType>(initialView)
  const [baseDate, setBaseDate] = useState(initialDate)

  // 임원 레이어 체크박스 상태 (기본: 모두 ON)
  const [layerVis, setLayerVis] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(users.map(u => [u.id, true]))
  )
  const [commonVis, setCommonVis] = useState(true)

  // 필터링
  const visibleSchedules = useMemo(
    () =>
      schedules.filter(s => {
        if (s.type === 'common') return commonVis
        return s.owner ? (layerVis[s.owner.id] ?? true) : commonVis
      }),
    [schedules, layerVis, commonVis]
  )

  // URL에 modal=form&date= 추가 (기존 파라미터 유지)
  function openCreate(date: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('modal', 'form')
    params.set('date', date)
    router.push(`?${params.toString()}`)
  }

  // URL에 detail= 추가
  function openDetail(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('detail', id)
    router.push(`?${params.toString()}`)
  }

  function handlePrev() {
    setBaseDate(prev => navigateDate(prev, view, -1))
  }

  function handleNext() {
    setBaseDate(prev => navigateDate(prev, view, 1))
  }

  function handleToday() {
    setBaseDate(today)
  }

  function handleLayerToggle(userId: string, checked: boolean) {
    setLayerVis(v => ({ ...v, [userId]: checked }))
  }

  function handleToggleAll() {
    const allOn = Object.values(layerVis).every(v => v)
    setLayerVis(Object.fromEntries(users.map(u => [u.id, !allOn])))
  }

  function getTitle() {
    if (view === 'month') return formatMonthTitle(baseDate)
    if (view === 'week') return formatWeekTitle(baseDate)
    return formatDayTitle(baseDate)
  }

  return (
    <div className="cal-wrap">
      {/* 페이지 헤더 */}
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">달력</h1>
          <div className="sub">{getTitle()}</div>
        </div>
        <div className="page-hd-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => openCreate(today)}>
            + 공통 일정
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => openCreate(today)}>
            <Icon name="plus" size={12} />
            일정 등록
          </button>
        </div>
      </div>

      {/* 툴바 */}
      <div className="cal-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={handlePrev}>
            <Icon name="chevL" size={12} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleToday}>오늘</button>
          <button className="btn btn-secondary btn-sm" onClick={handleNext}>
            <Icon name="chevR" size={12} />
          </button>
          <span className="cal-title">{getTitle()}</span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Segment
            value={view}
            onChange={v => setView(v as ViewType)}
            options={[
              { value: 'month', label: '월' },
              { value: 'week', label: '주' },
              { value: 'day', label: '일' },
            ]}
          />
        </div>
      </div>

      {/* 본문 */}
      <div className="cal-content">
        <div className="cal-main">
          {view === 'month' && (
            <MonthView
              baseDate={baseDate}
              today={today}
              schedules={visibleSchedules}
              holidays={holidays}
              onCellClick={openCreate}
              onEventClick={openDetail}
            />
          )}
          {view === 'week' && (
            <WeekView
              baseDate={baseDate}
              today={today}
              schedules={visibleSchedules}
              holidays={holidays}
              onEventClick={openDetail}
            />
          )}
          {view === 'day' && (
            <DayView
              baseDate={baseDate}
              today={today}
              schedules={visibleSchedules}
              holidays={holidays}
              onEventClick={openDetail}
            />
          )}
        </div>

        <CalendarAside
          users={users}
          layerVis={layerVis}
          commonVis={commonVis}
          onLayerToggle={handleLayerToggle}
          onCommonToggle={setCommonVis}
          onToggleAll={handleToggleAll}
        />
      </div>
    </div>
  )
}
