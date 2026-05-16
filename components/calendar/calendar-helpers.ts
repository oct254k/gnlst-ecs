// components/calendar/calendar-helpers.ts
// 달력 뷰 공통 헬퍼 함수

export function navigateDate(date: string, view: string, dir: number): string {
  const d = new Date(date + 'T00:00')
  if (view === 'month') d.setMonth(d.getMonth() + dir)
  else if (view === 'week') d.setDate(d.getDate() + dir * 7)
  else d.setDate(d.getDate() + dir)
  return d.toISOString().slice(0, 10)
}

export interface MonthCell {
  day: number
  date: string
  outside: boolean
}

export function buildMonthCells(date: string): MonthCell[] {
  const [y, m] = date.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  let firstDow = first.getDay() - 1
  if (firstDow < 0) firstDow = 6 // 월=0..일=6
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
  let dow = d.getDay() - 1
  if (dow < 0) dow = 6
  const monday = new Date(d)
  monday.setDate(d.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday)
    x.setDate(monday.getDate() + i)
    return x.toISOString().slice(0, 10)
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
