import { test, expect } from '@playwright/test';

// This test is a skeleton showing how you could automate logging into
// Google Search Console (or another SEO tool) with Playwright.  You'll
// need to supply your own credentials via environment variables, and be
// aware that Google may block automated logins without additional
// configuration (2FA, less‑secure app settings, captchas, etc.).

// To run:
//   GSC_USER=you@example.com GSC_PASS=yourpassword npx playwright test e2e/seo.spec.ts

// The script navigates to https://search.google.com/search-console and
// attempts to sign in, then goes to the Performance report and logs the
// first few query strings to the console.  You'll have to adapt it to
// your specific workflow and handle any interactive prompts manually.

test.describe('SEO tool login', () => {
  test('log into Google Search Console and inspect queries', async ({ page }) => {
    const user = process.env.GSC_USER;
    const pass = process.env.GSC_PASS;

    if (!user || !pass) {
      test.skip('GSC_USER and GSC_PASS environment variables are required');
      return;
    }

    // start at the login page
    await page.goto('https://accounts.google.com/signin/v2/identifier?service=searchconsole');

    // fill username
    await page.fill('input[type="email"]', user);
    await page.click('#identifierNext');

    // wait for password field to appear
    await page.waitForSelector('input[type="password"]', { state: 'visible' });
    await page.fill('input[type="password"]', pass);
    await page.click('#passwordNext');

    // give Google some time; may need to handle 2FA/captcha manually
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // navigate to performance report
    await page.goto('https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain:yourdomain.com');

    // snapshot first few queries from the table (dom selectors may change!)
    const queries = await page.$$eval('table[aria-label="Queries"] tbody tr td:nth-child(1)', els =>
      els.slice(0, 10).map(el => el.textContent?.trim())
    );

    console.log('Top queries:', queries);

    // assert we were able to see something
    expect(queries.length).toBeGreaterThan(0);
  });
});
