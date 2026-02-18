import { test, expect } from '@playwright/test';

test.describe('Stylists Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stylists');
  });

  test('displays stylists page heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Styliści|Stylists|Стилисты/);
  });

  test('loads stylist cards from database', async ({ page }) => {
    // Wait for data to load (spinner disappears)
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const stylistCards = page.locator('.grid > div');
    const count = await stylistCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('stylist cards display name and role', async ({ page }) => {
    await page.waitForTimeout(2000);
    // At least one stylist name should be visible
    const names = page.locator('h3');
    const count = await names.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('stylist cards display specialties badges', async ({ page }) => {
    // Wait for spinner to disappear and cards to render
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('.grid > div', { timeout: 10000 });
    const badges = page.locator('.bg-amber-100');
    await expect(badges.first()).toBeVisible({ timeout: 10000 });
  });

  test('stylist card has book button', async ({ page }) => {
    await page.waitForTimeout(2000);
    const bookButton = page.locator('button').filter({ hasText: /Zarezerwuj|Book|Забронировать/ }).first();
    await expect(bookButton).toBeVisible();
  });

  test('book button navigates to appointments with stylist filter', async ({ page }) => {
    await page.waitForTimeout(2000);
    const bookButton = page.locator('button').filter({ hasText: /Zarezerwuj|Book|Забронировать/ }).first();
    await bookButton.click();
    await expect(page).toHaveURL(/\/appointments\?stylist=/);
  });
});
