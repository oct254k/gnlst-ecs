import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiCards } from '@/components/dashboard/kpi-cards'

describe('KpiCards', () => {
  const baseData = {
    todayTotal: 7,
    todayCommon: 3,
    unreadNotifs: 2,
    execCount: 5,
  }

  it('오늘 일정 총 건수를 표시한다', () => {
    render(<KpiCards data={baseData} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('공통 일정 수를 표시한다', () => {
    render(<KpiCards data={baseData} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('미확인 알림 건수를 표시한다', () => {
    render(<KpiCards data={baseData} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('담당 임원 수를 표시한다', () => {
    render(<KpiCards data={baseData} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('개인 일정 수(total - common)를 계산해 표시한다', () => {
    render(<KpiCards data={baseData} />)
    // todayTotal(7) - todayCommon(3) = 4 → "공통 3건 · 개인 4건"
    expect(screen.getByText(/개인 4건/)).toBeInTheDocument()
  })

  it('모든 KPI 카드 레이블이 렌더링된다', () => {
    render(<KpiCards data={baseData} />)
    expect(screen.getByText('오늘 일정')).toBeInTheDocument()
    expect(screen.getByText('오늘 공통 일정')).toBeInTheDocument()
    expect(screen.getByText('미확인 알림')).toBeInTheDocument()
    expect(screen.getByText('담당 임원')).toBeInTheDocument()
  })
})
