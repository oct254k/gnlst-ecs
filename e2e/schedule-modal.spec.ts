import { test, expect } from '@playwright/test'

// E2E 테스트는 인증된 세션이 필요하므로 로그인 선행 필요
// 실제 실행: pnpm dev 서버 + Supabase 연결 후 실행

test.describe('일정 모달 (인증 후)', () => {
  test.skip('URL 파라미터로 일정 폼 모달이 열린다', async ({ page }) => {
    // 인증 세션 필요 — 실제 환경에서만 실행
    await page.goto('/dashboard?modal=form&type=personal&date=2026-05-15')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })

  test.skip('URL 파라미터로 일정 상세 모달이 열린다', async ({ page }) => {
    // 인증 세션 필요
    await page.goto('/dashboard?detail=mock-id')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
  })
})

test.describe('달력 뷰 (인증 후)', () => {
  test.skip('달력 페이지가 월간 뷰로 렌더링된다', async ({ page }) => {
    await page.goto('/calendar?view=month&year=2026&month=5')
    await expect(page.locator('.cal-month')).toBeVisible()
  })
})
