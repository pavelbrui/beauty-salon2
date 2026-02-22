import { test, expect } from '@playwright/test';

test.describe('Blog Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('displays blog hero section', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Blog|blog|Блог/i);
  });

  test('displays category filter buttons', async ({ page }) => {
    const filters = page.locator('button').filter({ hasText: /Wszystkie|All|Все/i });
    await expect(filters.first()).toBeVisible();
  });

  test('displays blog post cards when data is loaded', async ({ page }) => {
    // Wait for loading to finish
    await page.waitForTimeout(2000);
    // Check for either posts or empty state
    const hasContent = await page.locator('a[href^="/blog/"]').count();
    const hasEmpty = await page.locator('text=/Brak artykułów|No articles|Нет статей/i').count();
    expect(hasContent + hasEmpty).toBeGreaterThan(0);
  });

  test('blog link is visible in navigation', async ({ page }) => {
    const blogLink = page.locator('nav a[href="/blog"]');
    await expect(blogLink).toBeVisible();
  });
});

test.describe('Blog Detail Page', () => {
  test('navigates from list to detail and back', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForTimeout(2000);

    const firstPost = page.locator('a[href^="/blog/"]').first();
    const postExists = await firstPost.count();

    if (postExists > 0) {
      await firstPost.click();
      await page.waitForTimeout(1000);

      // Should show article content
      await expect(page.locator('article, h1')).toBeVisible();

      // Back link should exist
      const backLink = page.locator('a[href="/blog"]');
      await expect(backLink.first()).toBeVisible();
    }
  });
});
