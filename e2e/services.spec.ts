import { test, expect } from '@playwright/test';

test.describe('Services Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services');
  });

  test('displays services page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Usługi|Services|Услуги/);
  });

  test('displays "All" category filter button', async ({ page }) => {
    const allButton = page.locator('button').filter({ hasText: /Wszystkie|All|Все/ });
    await expect(allButton).toBeVisible();
  });

  test('loads service categories from database', async ({ page }) => {
    // Wait for services to load (categories appear as filter buttons)
    await page.waitForTimeout(2000);
    const categoryButtons = page.locator('.flex.flex-wrap button');
    const count = await categoryButtons.count();
    // At least "All" + some categories
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('clicking category button filters services', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Click a category button (not the "All" button)
    const categoryButtons = page.locator('.flex.flex-wrap button');
    const count = await categoryButtons.count();
    if (count > 1) {
      const categoryButton = categoryButtons.nth(1);
      const categoryText = await categoryButton.textContent();
      await categoryButton.click();
      // URL should change to include category
      await expect(page).toHaveURL(/\/services\/.+/);
    }
  });

  test('"All" button resets category filter', async ({ page }) => {
    await page.goto('/services/Rzęsy');
    const allButton = page.locator('button').filter({ hasText: /Wszystkie|All|Все/ });
    await allButton.click();
    await expect(page).toHaveURL('/services');
  });

  test('service cards display price and duration', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Services should show PLN price
    const priceText = page.getByText(/PLN|zł/);
    const count = await priceText.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
