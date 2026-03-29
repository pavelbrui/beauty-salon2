import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { execSync, spawn } from 'child_process';

// Launch real Chrome with remote debugging, then connect via Playwright CDP

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
    console.log(`Buttons:`);
    buttons.forEach(b => {
      const text = b.trim().replace(/\s+/g, ' ').substring(0, 100);
      if (text) console.log(`  [btn] "${text}"`);
    });
  }

  const links = await page.getByRole('link').allTextContents();
  if (links.length > 0) {
    console.log(`Links:`);
    links.forEach(l => {
      const text = l.trim().replace(/\s+/g, ' ').substring(0, 100);
      if (text) console.log(`  [link] "${text}"`);
    });
  }

  await screenshot(page, label);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Step 1: Prepare a minimal profile copy
  const sourceProfile = path.join(process.env.LOCALAPPDATA!, 'Google/Chrome/User Data/Profile 6');
  const sourceUserData = path.join(process.env.LOCALAPPDATA!, 'Google/Chrome/User Data');
  const tmpDir = 'C:/tmp/chrome-cdp2';

  console.log('Przygotowuję profil...');

  // Remove old tmp if exists
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(tmpDir, 'Default'), { recursive: true });

  // Copy essential session files
  const essentialFiles = [
    'Cookies', 'Cookies-journal',
    'Login Data', 'Login Data-journal',
    'Web Data', 'Web Data-journal',
    'Preferences', 'Secure Preferences',
    'Network/Cookies', 'Network/Cookies-journal',
  ];

  for (const file of essentialFiles) {
    const src = path.join(sourceProfile, file);
    const dest = path.join(tmpDir, 'Default', file);
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      console.log(`  [+] ${file}`);
    } catch {
      // skip missing
    }
  }

  // Copy Local State (encryption keys)
  try {
    fs.copyFileSync(
      path.join(sourceUserData, 'Local State'),
      path.join(tmpDir, 'Local State')
    );
    console.log('  [+] Local State');
  } catch {}

  // Step 2: Launch Chrome with remote debugging
  const chromePath = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';

  console.log('\nUruchamiam Chrome z remote debugging...');

  const child = spawn(chromePath, [
    `--remote-debugging-port=9222`,
    `--user-data-dir=${tmpDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    '--start-maximized',
  ], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  // Wait for Chrome to start
  console.log('Czekam na Chrome...');
  let connected = false;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    try {
      const resp = execSync('curl -s http://127.0.0.1:9222/json/version', { timeout: 3000 }).toString();
      if (resp.includes('webSocketDebuggerUrl')) {
        console.log('[OK] Chrome debugging aktywne!');
        connected = true;
        break;
      }
    } catch {}
  }

  if (!connected) {
    console.log('[FAIL] Nie udało się połączyć z Chrome. Sprawdź czy się uruchomił.');
    process.exit(1);
  }

  // Step 3: Connect via CDP
  console.log('\nŁączę Playwright z Chrome...');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  console.log('[OK] Połączono!');

  const context = browser.contexts()[0];
  const page = context.pages()[0] || await context.newPage();

  // Step 4: Navigate to Google Business Profile
  const gbpUrl = 'https://www.google.com/search?q=Salon+Urody+Katarzyna+Brui,+manicure,+pedicure,+stylizacja+rz%C4%99s,+stylizacja+brwi,+makija%C5%BC+permanentny&stick=H4sIAAAAAAAA_-NgU1I1qDAxN0xLSzFOSjFJMjcwSk6xMqgwTrQ0MEgzNbBMsUhLTEwxXMSaHpyYk5-nEFqUn1Kp4J1YklhUVZmXqOBUVJqpo5CbmJeZXFqUqqNQkJoCZRWXVOZkViUmZyUqFFUdmVmMIpJUVA7Wlp2ZlXh0D1BXEdCI1LySvEoARQwhTZMAAAA&hl=ru&mat=CWx-Y38mjUEyElcBTVDHnvej_1V_RyyXOzNIwOeduvNI3o8BAg1W5V7GrKNEKL_caG9mV3SwW5UGcLFAHn3nFp1-1G0LP1m8cMwKcvqaexrCuGUGPrfsuioWK9It2fulSoo&authuser=0';

  console.log('\nOtwieram stronę GBP...');
  await page.goto(gbpUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(5000);

  await dumpPageInfo(page, '01-search-result');

  // Check if logged in or need login
  const url = page.url();
  if (url.includes('accounts.google.com')) {
    console.log('\n[!] Nie zalogowana — sesja nie przeniosła się.');
    console.log('Zaloguj się ręcznie w otwartej przeglądarce.');
    console.log('Potem naciśnij ENTER tutaj...');
    await new Promise<void>(r => { process.stdin.resume(); process.stdin.once('data', () => { process.stdin.pause(); r(); }); });
    await sleep(3000);
    await page.goto(gbpUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);
  }

  await dumpPageInfo(page, '02-after-login');

  console.log('\n[OK] Chrome otwarty z remote debugging.');
  console.log('Przeglądarka zostaje otwarta.');
  console.log('Naciśnij ENTER aby zakończyć skrypt (Chrome pozostanie).');

  await new Promise<void>(r => { process.stdin.resume(); process.stdin.once('data', () => { process.stdin.pause(); r(); }); });
}

main().catch(console.error);
