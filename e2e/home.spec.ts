import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays hero section with salon name', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Katarzyna Brui');
  });

  test('displays "Book Now" button in hero', async ({ page }) => {
    const bookButton = page.locator('header button', { hasText: /zarezerwuj|book now|забронировать/i });
    await expect(bookButton).toBeVisible();
  });

  test('displays about section', async ({ page }) => {
    const aboutSection = page.locator('section').filter({ hasText: /Witaj|Welcome|Добро/i });
    await expect(aboutSection).toBeVisible();
  });

  test('loads and displays services carousel', async ({ page }) => {
    const servicesSection = page.locator('#services');
    await expect(servicesSection).toBeVisible();
  });

  test('displays reviews section', async ({ page }) => {
    const reviewsSection = page.locator('#reviews');
    await expect(reviewsSection).toBeVisible();
  });

  test('displays contact info with address', async ({ page }) => {
    await expect(page.getByText('Młynowa 46')).toBeVisible();
  });

  test('displays footer with copyright', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toContainText('Katarzyna Brui');
  });

  test('displays social media links', async ({ page }) => {
    const facebookLink = page.locator('a[href*="facebook.com"]');
    const instagramLink = page.locator('a[href*="instagram.com"]');
    await expect(facebookLink).toBeVisible();
    await expect(instagramLink).toBeVisible();
  });
});
