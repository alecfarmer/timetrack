import { test, expect } from "@playwright/test"

test.describe("Smoke tests", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle(/OnSite/)
  })

  test("login page loads", async ({ page }) => {
    await page.goto("/login")
    await expect(page.locator("input[type=email]")).toBeVisible()
  })

  test("unauthenticated user is redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForURL(/\/login/)
  })
})
