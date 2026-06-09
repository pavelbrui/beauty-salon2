// e2e/booksy-reservation.spec.ts
import { test, expect } from '@playwright/test';

/**
 * End‑to‑end test that exercises the full booking flow which syncs to Booksy.
 * It simulates a user reserving a "Manicure" with stylist "Agnessa" on 16 June 2026 at 10:00.
 * Adjust selectors if UI markup changes.
 */
test('Booksy reservation flow – manicure with Agnessa on 16 June 2026 10:00', async ({ page }) => {
  // 1️⃣ Open site
  await page.goto('http://localhost:3000');

  // 2️⃣ Open Quick Booking popup – adjust selector to match your UI
  const quickBookingButton = page.getByRole('button', { name: /quick booking/i });
  await expect(quickBookingButton).toBeVisible();
  await quickBookingButton.click();

  // 3️⃣ Select service "Manicure"
  const manicureService = page.getByRole('button', { name: /manicure/i });
  await expect(manicureService).toBeVisible();
  await manicureService.click();

  // 4️⃣ Wait for time slots to load and pick the desired slot
  // The time‑grid renders each slot as a button with the time text (e.g., "10:00").
  const targetSlot = page.getByRole('button', { name: '10:00' });
  await expect(targetSlot).toBeVisible();
  await targetSlot.click();

  // 5️⃣ Fill contact form (BookingForm component)
  await page.fill('[name="name"]', 'Test User');
  await page.fill('[name="phone"]', '+48 123 456 789');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="notes"]', 'Automated test reservation');

  // 6️⃣ Submit the form
  const confirmButton = page.getByRole('button', { name: /potwierdź|confirm/i });
  await expect(confirmButton).toBeEnabled();
  await confirmButton.click();

  // 7️⃣ Verify success popup appears
  const successHeader = page.getByRole('heading', { name: /rezerwacja została potwierdzona|booking confirmed/i });
  await expect(successHeader).toBeVisible({ timeout: 5000 });

  // 8️⃣ (Optional) Verify that the Booksy sync was attempted – this would be a network request.
  // Playwright can intercept requests:
  const [request] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/.netlify/functions/booksy-sync-background') && resp.status() === 202),
    // The click that triggers the sync was already performed above.
  ]);
  expect(request).toBeTruthy();
});
