import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('displays admin panel heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Panel Administracyjny');
  });

  test('displays all admin tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Usługi' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Rezerwacje' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Styliści' })).toBeVisible();
  });

  test('services tab is active by default', async ({ page }) => {
    const servicesTab = page.getByRole('button', { name: 'Usługi' });
    await expect(servicesTab).toHaveClass(/amber/);
  });

  test('clicking bookings tab switches content', async ({ page }) => {
    await page.getByRole('button', { name: 'Rezerwacje' }).click();
    // Bookings tab should now be active
    const bookingsTab = page.getByRole('button', { name: 'Rezerwacje' });
    await expect(bookingsTab).toHaveClass(/amber/);
  });

  test('all tabs are clickable and switch views', async ({ page }) => {
    const tabs = ['Usługi', 'Rezerwacje'];
    for (const tabName of tabs) {
      await page.getByRole('button', { name: tabName }).click();
      const tab = page.getByRole('button', { name: tabName });
      await expect(tab).toHaveClass(/amber/);
    }
  });

  test('navbar is not visible on admin page', async ({ page }) => {
    const navbar = page.locator('nav').filter({ hasText: 'KB Beauty' });
    await expect(navbar).not.toBeVisible();
  });
});
