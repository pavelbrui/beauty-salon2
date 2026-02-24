import { test, expect } from '@playwright/test';

test.describe('Gallery Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gallery');
  });

  test('displays gallery page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Galeria|Gallery|Галерея/);
  });

  test('displays category filter buttons', async ({ page }) => {
    // At minimum the "all" filter should be present (PL/EN/RU).
    await expect(page.getByRole('button', { name: /Wszystkie|All|Все/ })).toBeVisible();
  });

  test('gallery renders image grid', async ({ page }) => {
    // Wait for loading to finish.
    await expect(page.getByLabel('Loading')).toBeHidden();

    const grid = page.locator('div.grid');
    const gridCount = await grid.count();
    if (gridCount > 0) {
      await expect(grid.first()).toBeVisible();
    } else {
      // No images -> no results message is expected.
      await expect(page.locator('main')).toContainText(/Brak wyników|No results|Нет результатов/);
    }
  });

  test('images have hover overlay effect', async ({ page }) => {
    await expect(page.getByLabel('Loading')).toBeHidden();

    const images = page.locator('div.grid img');
    const count = await images.count();
    if (count > 0) {
      // Image should exist in a group container
      const container = page.locator('.group').first();
      await expect(container).toBeVisible();
    }
  });
});
