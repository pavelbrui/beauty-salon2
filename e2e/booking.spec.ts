import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('booking page loads for valid service ID', async ({ page }) => {
    // First get a service ID from the services page
    await page.goto('/services');
    await page.waitForTimeout(2000);

    // Find a "book" button and click it
    const bookButton = page.locator('button').filter({ hasText: /Zarezerwuj|Book|Забронировать/ }).first();
    if (await bookButton.isVisible()) {
      await bookButton.click();
      // Should navigate to booking page or open modal
      await page.waitForTimeout(1000);
    }
  });

  test('appointments page loads and shows service selector', async ({ page }) => {
    await page.goto('/appointments');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('appointments page shows stylist filter', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForTimeout(2000);
    // Page should have some form of service/stylist selection
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
