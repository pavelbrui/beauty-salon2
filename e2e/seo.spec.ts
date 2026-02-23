import { test, expect } from '@playwright/test';

test.describe('SEO regression checks', () => {
  test('keeps module script in HTML for hydration', async ({ page }) => {
    await page.goto('/');
    const moduleScriptCount = await page.locator('script[type="module"]').count();
    expect(moduleScriptCount).toBeGreaterThan(0);
  });

  test('services page has one canonical and complete hreflang set', async ({ page }) => {
    await page.goto('/services');

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    await expect(canonical).toHaveAttribute('href', 'https://katarzynabrui.pl/services');

    await expect(page.locator('link[rel="alternate"][hreflang="pl"]')).toHaveAttribute('href', 'https://katarzynabrui.pl/services');
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', 'https://katarzynabrui.pl/en/services');
    await expect(page.locator('link[rel="alternate"][hreflang="ru"]')).toHaveAttribute('href', 'https://katarzynabrui.pl/ru/services');
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', 'https://katarzynabrui.pl/services');
  });

  test('appointments page is marked as noindex', async ({ page }) => {
    await page.goto('/appointments');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveCount(1);
    await expect(robots).toHaveAttribute('content', /noindex/);
  });

  test('not found page is marked as noindex', async ({ page }) => {
    await page.goto('/this-path-does-not-exist');
    await expect(page.locator('h1')).toContainText('404');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveCount(1);
    await expect(robots).toHaveAttribute('content', /noindex/);
  });
});
