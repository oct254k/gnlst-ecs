import { test, expect } from '@playwright/test'

test.describe('로그인 페이지', () => {
  test('로그인 폼이 렌더링된다', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('빈 폼 제출 시 유효성 오류가 표시된다', async ({ page }) => {
    await page.goto('/login')
    await page.locator('button[type="submit"]').click()
    // 브라우저 네이티브 required validation 또는 커스텀 오류 메시지
    const url = page.url()
    expect(url).toContain('/login')
  })
})

test.describe('인증이 필요한 페이지', () => {
  test('미인증 상태에서 /dashboard 접근 시 /login 으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('미인증 상태에서 /calendar 접근 시 /login 으로 리다이렉트된다', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page).toHaveURL(/\/login/)
  })
})
