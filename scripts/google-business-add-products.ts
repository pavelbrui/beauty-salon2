import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';

// ============================================================
// Google Business Profile — Auto-add Products & Services
// Usage: npx tsx scripts/google-business-add-products.ts
// ============================================================

const PRODUCTS = [
  // --- Makijaż permanentny ---
  {
    category: 'Makijaż permanentny',
    name: 'Makijaż permanentny brwi',
    price: '800',
    description: 'Makijaż permanentny brwi metodą pudrową. Profesjonalny zabieg wykonywany przez certyfikowaną specjalistkę. Długotrwały efekt naturalnych, pełnych brwi. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1773586030459-9184f722-04fa-43bc-99ce-474ce4679f70.png',
  },
  {
    category: 'Makijaż permanentny',
    name: 'Makijaż permanentny brwi z korektą',
    price: '1000',
    description: 'Kompletny zabieg makijażu permanentnego brwi z korektą w cenie. Metoda pudrowa, naturalny efekt. Salon Urody Katarzyna Brui, Białystok.',
    image: null,
  },
  {
    category: 'Makijaż permanentny',
    name: 'Makijaż permanentny ust',
    price: '850',
    description: 'Trwały makijaż ust z efektem 3D. Naturalny wygląd i długotrwały efekt. Idealne rozwiązanie dla kobiet ceniących piękne, wyraziste usta. Salon Urody Katarzyna Brui, Białystok.',
    image: null,
  },
  {
    category: 'Makijaż permanentny',
    name: 'Makijaż permanentny oczu',
    price: '450',
    description: 'Zagęszczenie linii rzęs dla podkreślenia spojrzenia. Permanentna kreska na górnej lub dolnej powiece. Salon Urody Katarzyna Brui, Białystok.',
    image: null,
  },
  {
    category: 'Makijaż permanentny',
    name: 'Odświeżenie makijażu permanentnego',
    price: '450',
    description: 'Odświeżenie istniejącego makijażu permanentnego brwi lub ust. Przywrócenie koloru i kształtu. Salon Urody Katarzyna Brui, Białystok.',
    image: null,
  },
  {
    category: 'Makijaż permanentny',
    name: 'Usuwanie makijażu permanentnego brwi (remover)',
    price: '170',
    description: 'Usuwanie makijażu permanentnego brwi metodą remover. Bezpieczna i skuteczna metoda. Salon Urody Katarzyna Brui, Białystok.',
    image: null,
  },
  {
    category: 'Makijaż permanentny',
    name: 'Konsultacja makijaż permanentny',
    price: '0',
    description: 'Bezpłatna profesjonalna konsultacja przed zabiegiem makijażu permanentnego. Omówienie oczekiwań, dobór kształtu i koloru. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1774120415228-789189a6-432f-4a92-a8c3-47cd94570ea7.jpg',
  },

  // --- Stylizacja rzęs ---
  {
    category: 'Stylizacja rzęs',
    name: 'Przedłużanie rzęs 1:1',
    price: '150',
    description: 'Przedłużanie rzęs metodą 1:1 — klasyczna metoda, naturalny efekt. Każda rzęsa dokleja się do jednej naturalnej. Salon Urody Katarzyna Brui, Białystok.',
    image: null,
  },
  {
    category: 'Stylizacja rzęs',
    name: 'Przedłużanie rzęs 2:1',
    price: '160',
    description: 'Przedłużanie rzęs metodą objętościową 2:1. Większy wolumen i gęstość rzęs. Salon Urody Katarzyna Brui, Białystok.',
    image: null,
  },
  {
    category: 'Stylizacja rzęs',
    name: 'Przedłużanie rzęs mokry efekt 2D',
    price: '170',
    description: 'Przedłużanie rzęs metodą mokry efekt 2D. Efektowny, dramatyczny wygląd mokrych rzęs. Salon Urody Katarzyna Brui, Białystok.',
    image: null,
  },
  {
    category: 'Stylizacja rzęs',
    name: 'Przedłużanie rzęs mokry efekt 3-4D',
    price: '190',
    description: 'Przedłużanie rzęs metodą mokry efekt 3-4D. Maksymalny wolumen i dramatyczny efekt. Salon Urody Katarzyna Brui, Białystok.',
    image: null,
  },
  {
    category: 'Stylizacja rzęs',
    name: 'Lifting rzęs + botox + farbowanie',
    price: '140',
    description: 'Kompleksowy zabieg liftingu rzęs z botoxem i farbowaniem. Podniesione, odżywione i ciemniejsze rzęsy. Efekt do 8 tygodni. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1772492249259-e6bc7b3a-61c0-431c-9abb-e6e1be772db4.jpg',
  },

  // --- Stylizacja brwi ---
  {
    category: 'Stylizacja brwi',
    name: 'Regulacja brwi',
    price: '50',
    description: 'Precyzyjna regulacja kształtu brwi. Profesjonalne dopasowanie do kształtu twarzy. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1772491529789-ffd4738c-96d8-4f42-be4f-1c68dfeacaba.jpg',
  },
  {
    category: 'Stylizacja brwi',
    name: 'Regulacja brwi + henna',
    price: '90',
    description: 'Profesjonalna regulacja brwi z henną. Kształt i kolor idealnie dopasowany do twarzy. Efekt do 4 tygodni. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1772492217102-cabc24be-6074-4309-a837-c94050d5286d.jpg',
  },
  {
    category: 'Stylizacja brwi',
    name: 'Laminowanie brwi + henna + regulacja',
    price: '130',
    description: 'Kompletny zabieg pielęgnacji brwi — laminowanie, henna i regulacja w jednym. Pełne, lśniące brwi idealnie ułożone. Salon Urody Katarzyna Brui, Białystok.',
    image: null,
  },

  // --- Manicure i pedicure ---
  {
    category: 'Manicure i pedicure',
    name: 'Manicure klasyczny',
    price: '100',
    description: 'Pielęgnacja paznokci z nałożeniem lakieru. Profesjonalny manicure z dbałością o detale. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1772491108765-3ecec959-07b0-4fa6-8413-15065cb37bd3.jpg',
  },
  {
    category: 'Manicure i pedicure',
    name: 'Manicure hybrydowy',
    price: '140',
    description: 'Manicure z lakierem hybrydowym — trwałość do 3 tygodni. Szeroki wybór kolorów. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1772491212671-7deec07e-9e32-4f33-aa6c-80685fdff9d1.jpg',
  },
  {
    category: 'Manicure i pedicure',
    name: 'Manicure japoński',
    price: '130',
    description: 'Japoński rytuał pielęgnacji paznokci — naturalne wzmocnienie płytki. Intensywne nawilżenie i odżywienie. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1772490842239-332238f2-4fc8-442e-abda-756a894ba70f.jpg',
  },
  {
    category: 'Manicure i pedicure',
    name: 'Uzupełnienie żelem / Manicure żelowy',
    price: '160',
    description: 'Uzupełnienie paznokci żelowych. Przedłużenie trwałości i odnowienie wyglądu. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1772490745260-ffec10d0-4606-4544-84ce-87fc5f49d6c8.jpg',
  },

  // --- Laserowe usuwanie ---
  {
    category: 'Laserowe usuwanie',
    name: 'Laserowe usuwanie tatuażu',
    price: '180',
    description: 'Profesjonalne usuwanie tatuażu laserem. Bezpieczna i skuteczna metoda na pozbycie się niechcianego tatuażu. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1772322588441-7e02ba5d-c907-4ac7-b667-a98294c23524.webp',
  },
  {
    category: 'Laserowe usuwanie',
    name: 'Laserowe usunięcie makijażu permanentnego',
    price: '170',
    description: 'Precyzyjne usuwanie makijażu permanentnego laserem. Skuteczna metoda na korektę lub całkowite usunięcie. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1772322715959-0e10f9de-3b71-4029-8d0e-fb78410ea791.webp',
  },
  {
    category: 'Laserowe usuwanie',
    name: 'Laserowe usuwanie kresek permanentnych',
    price: '200',
    description: 'Usuwanie kresek wykonanych makijażem permanentnym. Precyzyjny zabieg laserowy. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1772322644828-b1e923df-b7fe-4ab2-b6c9-455585d56eac.webp',
  },

  // --- Peeling węglowy ---
  {
    category: 'Peeling węglowy',
    name: 'Laserowy peeling węglowy',
    price: '200',
    description: 'Głęboko oczyszczający zabieg z użyciem lasera i węglowej maski. Redukcja porów, rozjaśnienie skóry, efekt glow. Salon Urody Katarzyna Brui, Białystok.',
    image: null,
  },

  // --- Pakiety ---
  {
    category: 'Pakiety',
    name: 'Lifting rzęs + laminowanie brwi',
    price: '230',
    description: 'Kompleksowy pakiet — lifting rzęs i laminowanie brwi w jednej wizycie. Oszczędność czasu i pieniędzy. Salon Urody Katarzyna Brui, Białystok.',
    image: 'https://twifcurnuhlmhhrnwpib.supabase.co/storage/v1/object/public/service-images/service-images/1772491974164-5c70090e-e2a9-47a4-8d84-7f856524762d.jpg',
  },
];

// Download image to temp file
async function downloadImage(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, destPath).then(resolve);
          return;
        }
      }
      if (response.statusCode !== 200) {
        console.log(`  [!] Failed to download image: HTTP ${response.statusCode}`);
        resolve(false);
        return;
      }
      const file = fs.createWriteStream(destPath);
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
      file.on('error', () => resolve(false));
    }).on('error', () => resolve(false));
  });
}

async function waitForUserLogin(page: Page) {
  console.log('\n========================================');
  console.log('  KROK 1: Zaloguj się do Google');
  console.log('  Przeglądarka jest otwarta.');
  console.log('  Zaloguj się na swoje konto Google,');
  console.log('  a potem naciśnij ENTER w terminalu.');
  console.log('========================================\n');

  // Navigate to Google Business Profile
  await page.goto('https://business.google.com/', { waitUntil: 'networkidle' });

  // Wait for user to press Enter in terminal
  await new Promise<void>((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.pause();
      resolve();
    });
  });
}

async function addProduct(page: Page, product: typeof PRODUCTS[0], index: number) {
  console.log(`\n[${index + 1}/${PRODUCTS.length}] Dodaję: ${product.name} (${product.price} PLN)`);

  try {
    // Go to "Add product" page
    // Google Business Profile Manager URL for adding products
    await page.goto('https://business.google.com/products', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Look for "Add product" button
    const addBtn = page.getByRole('button', { name: /add product|dodaj produkt|nowy produkt/i });
    if (await addBtn.isVisible({ timeout: 5000 })) {
      await addBtn.click();
      await page.waitForTimeout(1500);
    }

    // Fill product name
    const nameInput = page.locator('input[aria-label*="name"], input[aria-label*="nazwa"], input[placeholder*="name"], input[placeholder*="nazwa"]').first();
    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill(product.name);
    }

    // Fill category
    const categoryInput = page.locator('input[aria-label*="category"], input[aria-label*="kategoria"]').first();
    if (await categoryInput.isVisible({ timeout: 2000 })) {
      await categoryInput.fill(product.category);
    }

    // Fill price
    const priceInput = page.locator('input[aria-label*="price"], input[aria-label*="cena"], input[type="number"]').first();
    if (await priceInput.isVisible({ timeout: 2000 })) {
      await priceInput.fill(product.price);
    }

    // Fill description
    const descInput = page.locator('textarea[aria-label*="description"], textarea[aria-label*="opis"], textarea').first();
    if (await descInput.isVisible({ timeout: 2000 })) {
      await descInput.fill(product.description);
    }

    // Upload image if available
    if (product.image) {
      const tmpDir = path.join(process.cwd(), 'tmp-images');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const ext = product.image.match(/\.(png|jpg|jpeg|webp)/i)?.[0] || '.jpg';
      const imgPath = path.join(tmpDir, `product-${index}${ext}`);

      const downloaded = await downloadImage(product.image, imgPath);
      if (downloaded) {
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.count() > 0) {
          await fileInput.setInputFiles(imgPath);
          await page.waitForTimeout(2000);
          console.log(`  [+] Zdjęcie dodane`);
        }
      }
    }

    // Click Save/Submit
    const saveBtn = page.getByRole('button', { name: /save|zapisz|opublikuj|publish|apply/i });
    if (await saveBtn.isVisible({ timeout: 3000 })) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      console.log(`  [OK] Produkt dodany: ${product.name}`);
    } else {
      console.log(`  [?] Nie znaleziono przycisku zapisu — sprawdź przeglądarkę`);
      // Pause so user can manually save
      await page.waitForTimeout(5000);
    }

  } catch (err) {
    console.log(`  [!] Błąd przy dodawaniu "${product.name}": ${(err as Error).message}`);
    console.log(`  Kontynuuję z następnym produktem...`);
  }
}

async function main() {
  console.log('==============================================');
  console.log('  Google Business Profile — Auto-Add Products');
  console.log('  Salon Urody Katarzyna Brui');
  console.log(`  Produktów do dodania: ${PRODUCTS.length}`);
  console.log('==============================================');

  // Launch browser (visible, not headless)
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: null, // use full window
    locale: 'pl-PL',
  });

  const page = await context.newPage();

  // Step 1: User logs in
  await waitForUserLogin(page);

  console.log('\nSprawdzam czy jesteś zalogowana...');
  await page.waitForTimeout(2000);

  // Step 2: Add products one by one
  console.log('\n--- Rozpoczynam dodawanie produktów ---\n');

  for (let i = 0; i < PRODUCTS.length; i++) {
    await addProduct(page, PRODUCTS[i], i);
  }

  // Cleanup temp images
  const tmpDir = path.join(process.cwd(), 'tmp-images');
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
    console.log('\nUsunięto tymczasowe pliki.');
  }

  console.log('\n==============================================');
  console.log('  GOTOWE! Wszystkie produkty dodane.');
  console.log('  Sprawdź wynik w Google Business Profile.');
  console.log('==============================================');

  // Keep browser open for review
  console.log('\nNaciśnij ENTER aby zamknąć przeglądarkę...');
  await new Promise<void>((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.pause();
      resolve();
    });
  });

  await browser.close();
}

main().catch(console.error);
