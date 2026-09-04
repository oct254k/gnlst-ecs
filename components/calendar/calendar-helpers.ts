// components/calendar/calendar-helpers.ts
// 달력 뷰 공통 헬퍼 함수

export function navigateDate(date: string, view: string, dir: number): string {
  const d = new Date(date + 'T00:00')
  if (view === 'month') {
    // 말일 기준 이동 시 다음 달이 건너뛰어지지 않도록 일자를 해당 월 말일로 보정
    const day = d.getDate()
    d.setDate(1)
    d.setMonth(d.getMonth() + dir)
    const lastDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    d.setDate(Math.min(day, lastDate))
  }
  else if (view === 'week') d.setDate(d.getDate() + dir * 7)
  else d.setDate(d.getDate() + dir)
  return fmt(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export interface MonthCell {
  day: number
  date: string
  outside: boolean
}

export function buildMonthCells(date: string): MonthCell[] {
  const [y, m] = date.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const firstDow = first.getDay() // 일=0..토=6
  const lastDate = new Date(y, m, 0).getDate()
  const cells: MonthCell[] = []

  // 이전 달
  const prevLast = new Date(y, m - 1, 0).getDate()
  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ day: prevLast - i, date: fmt(y, m - 1, prevLast - i), outside: true })
  }
  // 현재 달
  for (let d = 1; d <= lastDate; d++) {
    cells.push({ day: d, date: fmt(y, m, d), outside: false })
  }
  // 다음 달 (42칸)
  let nextDay = 1
  while (cells.length < 42) {
    cells.push({ day: nextDay, date: fmt(y, m + 1, nextDay++), outside: true })
  }
  return cells
}

function fmt(y: number, m: number, d: number): string {
  let mm = m
  let yy = y
  if (m < 1) { mm = 12; yy = y - 1 }
  if (m > 12) { mm = 1; yy = y + 1 }
  return `${yy}-${String(mm).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function buildWeekDays(date: string): string[] {
  const d = new Date(date + 'T00:00')
  const sunday = new Date(d)
  sunday.setDate(d.getDate() - d.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(sunday)
    x.setDate(sunday.getDate() + i)
    return fmt(x.getFullYear(), x.getMonth() + 1, x.getDate())
  })
}

export function formatMonthTitle(date: string): string {
  const [y, m] = date.split('-').map(Number)
  return `${y}년 ${m}월`
}

export function formatWeekTitle(date: string): string {
  const days = buildWeekDays(date)
  return `${days[0].replace(/-/g, '.')} ~ ${days[6].slice(5).replace('-', '.')}`
}

export function formatDayTitle(date: string): string {
  return `${date.replace(/-/g, '.')} (${weekdayKo(date)})`
}

export function weekdayKo(date: string): string {
  return ['일', '월', '화', '수', '목', '금', '토'][new Date(date + 'T00:00').getDay()]
}

export function isAllDay(start_time: string | null): boolean {
  return start_time === null
}
