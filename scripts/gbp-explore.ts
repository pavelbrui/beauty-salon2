import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

// ============================================================
// Step 1: Explore Google Business Profile structure
// Opens Chrome with your profile, takes screenshots, dumps HTML
// ============================================================

const SCREENSHOTS_DIR = path.join(process.cwd(), 'tmp-screenshots');

async function screenshot(page: Page, name: string) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  Screenshot: ${filePath}`);
}

async function dumpPageInfo(page: Page, label: string) {
  console.log(`\n--- ${label} ---`);
  console.log(`URL: ${page.url()}`);
  console.log(`Title: ${await page.title()}`);

  // Dump all buttons
  const buttons = await page.getByRole('button').allTextContents();
  if (buttons.length > 0) {
    console.log(`Buttons (${buttons.length}):`);
    buttons.slice(0, 30).forEach(b => console.log(`  [btn] "${b.trim().substring(0, 80)}"`));
  }

  // Dump all links
  const links = await page.getByRole('link').allTextContents();
  if (links.length > 0) {
    console.log(`Links (${links.length}):`);
    links.slice(0, 30).forEach(l => console.log(`  [link] "${l.trim().substring(0, 80)}"`));
  }

  // Dump all inputs
  const inputs = await page.locator('input, textarea').all();
  console.log(`Inputs (${inputs.length}):`);
  for (const inp of inputs.slice(0, 20)) {
    const type = await inp.getAttribute('type') || 'text';
    const name = await inp.getAttribute('name') || '';
    const aria = await inp.getAttribute('aria-label') || '';
    const placeholder = await inp.getAttribute('placeholder') || '';
    console.log(`  [input] type="${type}" name="${name}" aria="${aria}" placeholder="${placeholder}"`);
  }

  await screenshot(page, label);
}

async function main() {
  const sourceDir = process.env.LOCALAPPDATA + '/Google/Chrome/User Data';
  const tmpProfileDir = path.join(process.env.TEMP || 'c:/tmp', 'chrome-pw-profile');

  // Copy profile
  console.log('Kopiuję profil Chrome...');
  if (!fs.existsSync(tmpProfileDir)) fs.mkdirSync(tmpProfileDir, { recursive: true });

  // Profile 6 = brui.katarzyna@gmail.com
  const profileName = 'Profile 6';
  const filesToCopy = [
    `${profileName}/Cookies`,
    `${profileName}/Login Data`,
    `${profileName}/Web Data`,
    `${profileName}/Preferences`,
    `${profileName}/Secure Preferences`,
    'Local State',
  ];
  for (const file of filesToCopy) {
    const src = path.join(sourceDir, file);
    // Map "Profile 6/X" -> "Default/X" so Chrome uses it as default in new context
    const destFile = file.replace(profileName, 'Default');
    const dest = path.join(tmpProfileDir, destFile);
    try {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, dest);
      console.log(`  [+] ${file}`);
    } catch {
      console.log(`  [-] ${file} (pominięto)`);
    }
  }

  const context = await chromium.launchPersistentContext(tmpProfileDir, {
    headless: false,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
    viewport: null,
    locale: 'pl-PL',
    channel: 'chrome',
  });

  const page = await context.newPage();

  // Step 1: Go to Google Business Profile
  console.log('\n1. Otwieram business.google.com...');
  await page.goto('https://business.google.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Accept consent if present
  const consentBtn = page.locator('button:has-text("Zgadzam się"), button:has-text("I agree"), button:has-text("Accept all"), button:has-text("Zaakceptuj wszystko")');
  if (await consentBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('  Akceptuję cookies/consent...');
    await consentBtn.first().click();
    await page.waitForTimeout(3000);
  }

  await dumpPageInfo(page, '01-business-home');

  // Step 2: Try to navigate to products
  console.log('\n2. Szukam sekcji Products...');

  // Try direct URL
  await page.goto('https://business.google.com/products', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await dumpPageInfo(page, '02-products-page');

  // Step 3: Try the edit profile URL from user's link
  console.log('\n3. Próbuję link do edycji profilu...');
  await page.goto('https://business.google.com/edit/products', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await dumpPageInfo(page, '03-edit-products');

  // Step 4: Try merchant center
  console.log('\n4. Próbuję dashboard z menu...');
  await page.goto('https://business.google.com/dashboard/', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await dumpPageInfo(page, '04-dashboard');

  // Also dump the full page HTML for analysis (first 5000 chars)
  const html = await page.content();
  const htmlPath = path.join(SCREENSHOTS_DIR, 'dashboard-html.txt');
  fs.writeFileSync(htmlPath, html.substring(0, 15000));
  console.log(`\nFull HTML (first 15K): ${htmlPath}`);

  console.log('\n\nPrzeglądarka zostaje otwarta — możesz ręcznie nawigować.');
  console.log('Naciśnij Ctrl+C w terminalu aby zakończyć.');

  // Keep alive
  await new Promise(() => {});
}

main().catch(console.error);
