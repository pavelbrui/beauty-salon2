import { test, expect } from '@playwright/test';

test.describe('Booksy Complex Services Admin', () => {
  test('open admin and navigate to Booksy complex services tab', async ({ page }) => {
    await page.goto('/admin');
    // Click Booksy tab
    await page.click('text=Booksy');
    // Click Complex Services tab button
    await page.click('text=Usługi Kompleksowe');
    // Expect the complex services title to be visible
    await expect(page.locator('text=Usługi Kompleksowe (Podwójna Obsada)')).toBeVisible();
  });
});
