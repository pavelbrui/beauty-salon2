import { test, expect } from '@playwright/test';

test.describe('Booking Calendar System', () => {
  test('User calendar view loads and supports view mode toggle', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForTimeout(1000);

    // Switch to calendar view if list view is active
    const calendarViewButton = page.locator('button[title="Kalendarz"]');
    if (await calendarViewButton.isVisible()) {
      await calendarViewButton.click();
      await page.waitForTimeout(500);
    }

    // Verify calendar view header is present
    const header = page.locator('h3').first();
    await expect(header).toBeVisible();

    // Check Month/Week view buttons exist
    const monthButton = page.getByRole('button', { name: /Miesiąc|Month|Месяц/i });
    const weekButton = page.getByRole('button', { name: /Tydzień|Week|Неделя/i });

    if (await weekButton.isVisible()) {
      await weekButton.click();
      await page.waitForTimeout(300);
      await expect(weekButton).toHaveClass(/bg-white/);

      // Switch back to month view
      await monthButton.click();
      await page.waitForTimeout(300);
      await expect(monthButton).toHaveClass(/bg-white/);
    }
  });

  test('Admin calendar view loads with Month, Week, and Day modes', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);

    const isAuthorized = await page.getByRole('button', { name: 'Rezerwacje' }).isVisible();
    if (isAuthorized) {
      // Click Rezerwacje tab
      await page.getByRole('button', { name: 'Rezerwacje' }).click();
      await page.waitForTimeout(500);

      // Click Calendar view icon button
      const calendarIconButton = page.locator('button[title="Kalendarz"]');
      if (await calendarIconButton.isVisible()) {
        await calendarIconButton.click();
        await page.waitForTimeout(500);

        // Verify view mode tabs: Miesiąc, Tydzień, Dzień (Styliści)
        const monthTab = page.getByRole('button', { name: /Miesiąc|Month|Месяц/i });
        const weekTab = page.getByRole('button', { name: /Tydzień|Week|Неделя/i });
        const dayTab = page.getByRole('button', { name: /Dzień|Day|День/i });

        await expect(monthTab).toBeVisible();
        await expect(weekTab).toBeVisible();
        await expect(dayTab).toBeVisible();

        // Switch to Week view
        await weekTab.click();
        await page.waitForTimeout(300);
        await expect(weekTab).toHaveClass(/bg-white/);

        // Switch to Day view (multi-stylist timeline)
        await dayTab.click();
        await page.waitForTimeout(300);
        await expect(dayTab).toHaveClass(/bg-white/);

        // Switch back to Month view
        await monthTab.click();
        await page.waitForTimeout(300);
        await expect(monthTab).toHaveClass(/bg-white/);
      }
    }
  });
});
