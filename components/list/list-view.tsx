'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { ListToolbar } from './list-toolbar'
import { ActiveFilterChips } from './active-filter-chips'
import { ListTable } from './list-table'
import { ListPagination } from './list-pagination'
import type { MockSchedule, MockUser } from '@/app/(app)/list/page'
import type { SortCol, SortState } from './list-table'

function getDefaultDateRange(): { start: string; end: string } {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const pad = (n: number) => String(n).padStart(2, '0')
  const start = `${y}-${pad(m + 1)}-01`
  // 이번 달 말일: 다음 달 1일에서 하루 빼기
  const lastDay = new Date(y, m + 1, 0).getDate()
  const end = `${y}-${pad(m + 1)}-${pad(lastDay)}`
  return { start, end }
}

const { start: DEFAULT_DATE_START, end: DEFAULT_DATE_END } = getDefaultDateRange()
const PER_PAGE_DEFAULT = 20

interface ListViewProps {
  initialSchedules: MockSchedule[]
  users: MockUser[]
}

export function ListView({ initialSchedules, users }: ListViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 필터 상태
  const [search, setSearch] = useState('')
  const [dateStart, setDateStart] = useState(DEFAULT_DATE_START)
  const [dateEnd, setDateEnd] = useState(DEFAULT_DATE_END)
  const [filterOwner, setFilterOwner] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [sort, setSort] = useState<SortState>({ col: 'schedule_date', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(PER_PAGE_DEFAULT)
  const [quickOpen, setQuickOpen] = useState(false)

  // 사용자 맵
  const userMap = useMemo(() => {
    const m = new Map<string, MockUser>()
    users.forEach((u) => m.set(u.id, u))
    return m
  }, [users])

  // 필터링
  const filtered = useMemo(() => {
    let result = initialSchedules.filter((s) => {
      if (s.schedule_date < dateStart || s.schedule_date > dateEnd) return false
      if (filterType !== 'all' && s.type !== filterType) return false
      if (filterOwner !== 'all') {
        if (filterOwner === 'common') {
          if (s.type !== 'common') return false
        } else {
          if (s.owner_id !== filterOwner) return false
        }
      }
      if (search) {
        const q = search.toLowerCase()
        if (
          !s.title.toLowerCase().includes(q) &&
          !(s.location ?? '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })

    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sort.col === 'schedule_date') {
        cmp =
          a.schedule_date.localeCompare(b.schedule_date) ||
          (a.start_time ?? '99:99').localeCompare(b.start_time ?? '99:99')
      } else if (sort.col === 'title') {
        cmp = a.title.localeCompare(b.title, 'ko')
      } else if (sort.col === 'owner') {
        const aName = a.owner_id ? (userMap.get(a.owner_id)?.name ?? 'zzz') : 'zzz'
        const bName = b.owner_id ? (userMap.get(b.owner_id)?.name ?? 'zzz') : 'zzz'
        cmp = aName.localeCompare(bName, 'ko')
      }
      return sort.dir === 'asc' ? cmp : -cmp
    })

    return result
  }, [initialSchedules, search, dateStart, dateEnd, filterOwner, filterType, sort, userMap])

  // 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const currentPage = Math.min(page, totalPages)
  const pageSlice = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  // 활성 필터 칩
  const activeFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string }> = []
    if (filterType !== 'all') {
      chips.push({ key: 'type', label: filterType === 'common' ? '구분: 공통' : '구분: 개인' })
    }
    if (filterOwner !== 'all' && filterOwner !== 'common') {
      const u = userMap.get(filterOwner)
      if (u) chips.push({ key: 'owner', label: `담당: ${u.name}` })
    }
    if (filterOwner === 'common') {
      chips.push({ key: 'owner', label: '담당: 공통 일정' })
    }
    if (dateStart !== DEFAULT_DATE_START || dateEnd !== DEFAULT_DATE_END) {
      chips.push({ key: 'date', label: `${dateStart} ~ ${dateEnd}` })
    }
    if (search) {
      chips.push({ key: 'search', label: `"${search}"` })
    }
    return chips
  }, [filterType, filterOwner, dateStart, dateEnd, search, userMap])

  function clearFilter(key: string) {
    if (key === 'type') setFilterType('all')
    else if (key === 'owner') setFilterOwner('all')
    else if (key === 'date') { setDateStart(DEFAULT_DATE_START); setDateEnd(DEFAULT_DATE_END) }
    else if (key === 'search') setSearch('')
    setPage(1)
  }

  function clearAll() {
    setFilterType('all')
    setFilterOwner('all')
    setSearch('')
    setDateStart(DEFAULT_DATE_START)
    setDateEnd(DEFAULT_DATE_END)
    setPage(1)
  }

  function handleSortChange(col: SortCol) {
    setSort((prev) =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: 'asc' },
    )
    setPage(1)
  }

  async function handleExport() {
    const ownerIds =
      filterOwner !== 'all' && filterOwner !== 'common' ? [filterOwner] : undefined
    const scheduleType =
      filterType !== 'all' ? (filterType as 'personal' | 'common') : undefined

    const res = await fetch('/api/export/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_from: dateStart,
        date_to: dateEnd,
        owner_ids: ownerIds,
        type: scheduleType ?? null,
        keyword: search || null,
      }),
    })
    if (!res.ok) return
    const json = await res.json()
    const rows: Record<string, unknown>[] = json.data ?? []
    if (rows.length === 0) return

    const headers = Object.keys(rows[0])
    const csvLines = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h] ?? ''
            const str = String(val).replace(/"/g, '""')
            return `"${str}"`
          })
          .join(','),
      ),
    ]
    const bom = '﻿'
    const blob = new Blob([bom + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schedules_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleRowClick(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('detail', id)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function handleQuickAddSubmit() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('modal', 'form')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="list-wrap">
      {/* 페이지 헤더 */}
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">리스트</h1>
          <div className="sub">
            {filtered.length}건 · {dateStart} ~ {dateEnd}
          </div>
        </div>
        <div className="hd-action">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExport}
            disabled={filtered.length === 0}
          >
            <Icon name="download" size={12} /> 엑셀 다운로드
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('modal', 'form')
              router.push(`?${params.toString()}`, { scroll: false })
            }}
          >
            <Icon name="plus" size={12} /> 일정 등록
          </button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="page-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
        <ListToolbar
          search={search}
          dateStart={dateStart}
          dateEnd={dateEnd}
          filterOwner={filterOwner}
          filterType={filterType}
          users={users}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          onDateStartChange={(v) => { setDateStart(v); setPage(1) }}
          onDateEndChange={(v) => { setDateEnd(v); setPage(1) }}
          onOwnerChange={(v) => { setFilterOwner(v); setPage(1) }}
          onTypeChange={(v) => { setFilterType(v); setPage(1) }}
        />
        <ActiveFilterChips
          filters={activeFilters}
          onRemove={clearFilter}
          onClearAll={clearAll}
        />
      </div>

      {/* 테이블 스크롤 영역 */}
      <div className="main-scroll">
        <div className="page-body" style={{ paddingTop: 0 }}>
          <div className="card">
            <ListTable
              schedules={pageSlice}
              users={users}
              sort={sort}
              onSortChange={handleSortChange}
              onRowClick={handleRowClick}
              onClearFilters={clearAll}
              quickAddOpen={quickOpen}
              onQuickAddOpen={() => setQuickOpen(true)}
              onQuickAddClose={() => setQuickOpen(false)}
              onQuickAddSubmit={handleQuickAddSubmit}
            />
            <ListPagination
              total={filtered.length}
              page={currentPage}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={(pp) => { setPerPage(pp); setPage(1) }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
