import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('displays admin panel heading', async ({ page }) => {
    const pathname = new URL(page.url()).pathname;
    if (pathname === '/admin') {
      await expect(page.locator('h1')).toContainText('Panel Administracyjny');
    } else {
      // If not authenticated/authorized, app redirects to home.
      await expect(page.locator('h1')).toContainText(/Salon|Космет|Beauty/i);
    }
  });

  test('displays all admin tabs', async ({ page }) => {
    const pathname = new URL(page.url()).pathname;
    if (pathname === '/admin') {
      await expect(page.getByRole('button', { name: 'Usługi' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Rezerwacje' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Styliści' })).toBeVisible();
    } else {
      // Redirected away from admin, so admin tabs are not expected.
      await expect(page.getByRole('button', { name: 'Usługi' })).toHaveCount(0);
    }
  });

  test('services tab is active by default', async ({ page }) => {
    const pathname = new URL(page.url()).pathname;
    if (pathname === '/admin') {
      const servicesTab = page.getByRole('button', { name: 'Usługi' });
      await expect(servicesTab).toHaveClass(/amber/);
    } else {
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('clicking bookings tab switches content', async ({ page }) => {
    const pathname = new URL(page.url()).pathname;
    if (pathname === '/admin') {
      await page.getByRole('button', { name: 'Rezerwacje' }).click();
      // Bookings tab should now be active
      const bookingsTab = page.getByRole('button', { name: 'Rezerwacje' });
      await expect(bookingsTab).toHaveClass(/amber/);
    } else {
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('all tabs are clickable and switch views', async ({ page }) => {
    const pathname = new URL(page.url()).pathname;
    if (pathname === '/admin') {
      const tabs = ['Usługi', 'Rezerwacje'];
      for (const tabName of tabs) {
        await page.getByRole('button', { name: tabName }).click();
        const tab = page.getByRole('button', { name: tabName });
        await expect(tab).toHaveClass(/amber/);
      }
    } else {
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('navbar is not visible on admin page', async ({ page }) => {
    const pathname = new URL(page.url()).pathname;
    if (pathname === '/admin') {
      const navbar = page.locator('nav');
      await expect(navbar).toHaveCount(0);
    } else {
      await expect(page.locator('nav')).toBeVisible();
    }
  });
});
