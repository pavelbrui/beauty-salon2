import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'tmp-screenshots');

async function screenshot(page: Page, name: string) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  Screenshot: ${filePath}`);
}

async function dumpPageInfo(page: Page, label: string) {
  console.log(`\n--- ${label} ---`);
  console.log(`URL: ${page.url()}`);
  console.log(`Title: ${await page.title()}`);

  const buttons = await page.getByRole('button').allTextContents();
  if (buttons.length > 0) {
    console.log(`Buttons (${buttons.length}):`);
    buttons.slice(0, 40).forEach(b => {
      const text = b.trim().replace(/\s+/g, ' ').substring(0, 100);
      if (text) console.log(`  [btn] "${text}"`);
    });
  }

  const links = await page.getByRole('link').allTextContents();
  if (links.length > 0) {
    console.log(`Links (${links.length}):`);
    links.slice(0, 40).forEach(l => {
      const text = l.trim().replace(/\s+/g, ' ').substring(0, 100);
      if (text) console.log(`  [link] "${text}"`);
    });
  }

  const inputs = await page.locator('input, textarea').all();
  if (inputs.length > 0) {
    console.log(`Inputs (${inputs.length}):`);
    for (const inp of inputs.slice(0, 20)) {
      const type = await inp.getAttribute('type') || 'text';
      const name = await inp.getAttribute('name') || '';
      const aria = await inp.getAttribute('aria-label') || '';
      const placeholder = await inp.getAttribute('placeholder') || '';
      console.log(`  [input] type="${type}" name="${name}" aria="${aria}" placeholder="${placeholder}"`);
    }
  }

  await screenshot(page, label);
}

async function main() {
  console.log('Łączę się z Chrome (port 9222)...');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  console.log('[OK] Połączono z Chrome!');

  const contexts = browser.contexts();
  console.log(`Konteksty: ${contexts.length}`);

  const context = contexts[0];
  const pages = context.pages();
  console.log(`Otwarte karty: ${pages.length}`);

  // Use existing page or create new one
  const page = await context.newPage();

  // Navigate to the Google Business Profile via search
  const gbpUrl = 'https://www.google.com/search?q=Salon+Urody+Katarzyna+Brui,+manicure,+pedicure,+stylizacja+rz%C4%99s,+stylizacja+brwi,+makija%C5%BC+permanentny&stick=H4sIAAAAAAAA_-NgU1I1qDAxN0xLSzFOSjFJMjcwSk6xMqgwTrQ0MEgzNbBMsUhLTEwxXMSaHpyYk5-nEFqUn1Kp4J1YklhUVZmXqOBUVJqpo5CbmJeZXFqUqqNQkJoCZRWXVOZkViUmZyUqFFUdmVmMIpJUVA7Wlp2ZlXh0D1BXEdCI1LySvEoARQwhTZMAAAA&hl=ru&mat=CWx-Y38mjUEyElcBTVDHnvej_1V_RyyXOzNIwOeduvNI3o8BAg1W5V7GrKNEKL_caG9mV3SwW5UGcLFAHn3nFp1-1G0LP1m8cMwKcvqaexrCuGUGPrfsuioWK9It2fulSoo&authuser=0';

  console.log('\nOtwieram Google Business Profile...');
  await page.goto(gbpUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  await dumpPageInfo(page, '01-gbp-search');

  // Look for "Products" or "Продукты" or "Produkty" tab/link
  console.log('\nSzukam sekcji Produkty/Products...');

  // Try clicking on products/services in the business profile panel
  const productsLink = page.locator('a, button, [role="tab"]').filter({ hasText: /продукт|product|produkt|услуг|service|usług/i });
  const count = await productsLink.count();
  console.log(`Znaleziono elementów products/services: ${count}`);

  for (let i = 0; i < Math.min(count, 10); i++) {
    const text = await productsLink.nth(i).textContent();
    console.log(`  [${i}] "${text?.trim().replace(/\s+/g, ' ').substring(0, 80)}"`);
  }

  // Also dump all tab-like elements
  const tabs = await page.locator('[role="tab"], [data-tab], .merchant-tab').all();
  console.log(`\nTabs: ${tabs.length}`);
  for (const tab of tabs.slice(0, 20)) {
    const text = await tab.textContent();
    console.log(`  [tab] "${text?.trim().replace(/\s+/g, ' ').substring(0, 80)}"`);
  }

  console.log('\n\nPrzeglądarka otwarta. Sprawdź screenshoty w tmp-screenshots/');
  console.log('Naciśnij Ctrl+C aby zakończyć (Chrome pozostanie otwarty).');

  // Keep alive
  await new Promise(() => {});
}

main().catch(console.error);
