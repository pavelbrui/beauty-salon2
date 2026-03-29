import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'tmp-screenshots');

async function screenshot(page: Page, name: string) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  try {
    await page.screenshot({ path: filePath, fullPage: false, timeout: 10000 });
    console.log(`  Screenshot: ${filePath}`);
  } catch {
    console.log(`  [!] Screenshot failed`);
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Łączę się z Chrome na porcie 9222...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  console.log('[OK] Połączono!');

  const context = browser.contexts()[0];
  const pages = context.pages();
  console.log(`Otwarte karty: ${pages.length}`);

  // Use existing page
  const page = pages[0];
  if (!page) {
    console.log('[FAIL] Brak otwartych kart');
    process.exit(1);
  }

  console.log(`Obecna strona: ${page.url()}`);
  console.log(`Tytuł: ${await page.title()}`);

  // Accept consent if visible
  try {
    const consent = page.locator('button').filter({ hasText: /Принять все|Accept all|Zaakceptuj|Zgadzam/i });
    if (await consent.first().isVisible({ timeout: 3000 })) {
      console.log('Akceptuję cookies...');
      await consent.first().click();
      await sleep(3000);
    }
  } catch {}

  await screenshot(page, '01-current');

  // Check login
  const bodyText = await page.textContent('body').catch(() => '') || '';
  const hasSignIn = bodyText.includes('Войти') || bodyText.includes('Sign in') || bodyText.includes('Zaloguj');
  console.log(`\nZalogowana: ${hasSignIn ? 'NIE' : 'PRAWDOPODOBNIE TAK'}`);

  // Dump all clickable elements
  const allElements = await page.locator('a, button, [role="button"], [role="tab"], [role="link"]').all();
  console.log(`\nKlikalne elementy (${allElements.length}):`);

  for (const el of allElements) {
    try {
      const text = await el.textContent();
      const cleaned = text?.trim().replace(/\s+/g, ' ').substring(0, 100);
      if (cleaned && cleaned.length > 1 && cleaned.length < 80) {
        const tag = await el.evaluate(e => e.tagName);
        const href = await el.getAttribute('href').catch(() => null);
        const hrefStr = href ? ` → ${href.substring(0, 120)}` : '';
        console.log(`  [${tag}] "${cleaned}"${hrefStr}`);
      }
    } catch {}
  }

  await screenshot(page, '02-elements');

  console.log('\n--- Gotowe ---');
  await browser.disconnect();
}

main().catch(console.error);
