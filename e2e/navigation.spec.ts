import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('navbar displays KB Beauty logo', async ({ page }) => {
    await expect(page.getByText('KB Beauty')).toBeVisible();
  });

  test('logo links to home page', async ({ page }) => {
    await page.goto('/services');
    await page.getByText('KB Beauty').click();
    await expect(page).toHaveURL('/');
  });

  test('navigate to services page', async ({ page }) => {
    await page.locator('nav a[href="/services"]').click();
    await expect(page).toHaveURL('/services');
  });

  test('navigate to appointments page', async ({ page }) => {
    await page.locator('nav a[href="/appointments"]').click();
    await expect(page).toHaveURL('/appointments');
  });

  test('navigate to stylists page', async ({ page }) => {
    await page.locator('nav a[href="/stylists"]').click();
    await expect(page).toHaveURL('/stylists');
  });

  test('navigate to gallery page', async ({ page }) => {
    await page.locator('nav a[href="/gallery"]').click();
    await expect(page).toHaveURL('/gallery');
  });

  test('language switcher shows PL, EN, RU buttons', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'pl' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'en' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'ru' })).toBeVisible();
  });

  test('switching language to EN changes navigation text', async ({ page }) => {
    await page.locator('button', { hasText: 'en' }).click();
    // English translations: "Services", "Appointments"/"Bookings", "Stylists", "Gallery"
    await expect(page.locator('nav')).toContainText(/Services/i);
  });

  test('switching language to RU changes navigation text', async ({ page }) => {
    await page.locator('button', { hasText: 'ru' }).click();
    // Russian translations should appear
    await expect(page.locator('nav')).toContainText(/Услуги|Галерея|Стилисты/);
  });

  test('navbar is hidden on admin page', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('nav').filter({ hasText: 'KB Beauty' })).not.toBeVisible();
  });
});
