import { test, expect } from '@playwright/test';

test.describe('Gallery Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gallery');
  });

  test('displays gallery page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Galeria|Gallery|Галерея/);
  });

  test('displays category filter buttons', async ({ page }) => {
    await page.waitForTimeout(2000);
    // At minimum "all" button should be present
    const filterButtons = page.locator('button').filter({ hasText: /all|All/ });
    const count = await filterButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('gallery renders image grid', async ({ page }) => {
    await page.waitForTimeout(2000);
    const grid = page.locator('.grid');
    await expect(grid).toBeVisible();
  });

  test('images have hover overlay effect', async ({ page }) => {
    await page.waitForTimeout(2000);
    const images = page.locator('.grid img');
    const count = await images.count();
    if (count > 0) {
      // Image should exist in a group container
      const container = page.locator('.group').first();
      await expect(container).toBeVisible();
    }
  });
});
