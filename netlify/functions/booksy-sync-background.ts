import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// --- Supabase client with service_role (bypasses RLS) ---
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const syncSecret = process.env.BOOKSY_SYNC_SECRET || '';
const businessId = process.env.BOOKSY_BUSINESS_ID || '162206';
const discoveryMode = process.env.BOOKSY_SYNC_DISCOVERY === 'true';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BOOKSY_CALENDAR_URL = `https://booksy.com/pro/pl-pl/${businessId}/calendar`;

// --- Types ---
interface SyncPayload {
  action: 'create_block' | 'update_block' | 'remove_block';
  bookingId: string;
  startTime: string;
  endTime: string;
  stylistName?: string;
  oldStartTime?: string;
  oldEndTime?: string;
  secret: string;
}

interface CookieData {
  name: string;
  value: string;
  domain: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

// --- Helpers ---

async function updateSyncLog(
  bookingId: string,
  status: 'processing' | 'success' | 'failed',
  errorMessage?: string,
  screenshotUrl?: string
) {
  const update: Record<string, unknown> = { status };
  if (status === 'processing') {
    update.attempts = 1; // Will be incremented in SQL if needed
  }
  if (status === 'success' || status === 'failed') {
    update.processed_at = new Date().toISOString();
  }
  if (errorMessage) {
    update.error_message = errorMessage;
  }
  if (screenshotUrl) {
    update.screenshot_url = screenshotUrl;
  }

  // Update the most recent pending/processing entry for this booking
  const { error } = await supabase
    .from('booksy_sync_log')
    .update(update)
    .eq('booking_id', bookingId)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error updating sync log:', error);
  }
}

async function uploadScreenshot(
  screenshot: Buffer,
  name: string
): Promise<string | null> {
  const path = `booksy-sync/${Date.now()}_${name}.png`;
  const { error } = await supabase.storage
    .from('service-images')
    .upload(path, screenshot, { contentType: 'image/png', upsert: true });

  if (error) {
    console.error('Error uploading screenshot:', error);
    return null;
  }

  const { data } = supabase.storage.from('service-images').getPublicUrl(path);
  return data.publicUrl;
}

async function loadCookies(): Promise<CookieData[]> {
  const { data, error } = await supabase
    .from('booksy_session')
    .select('cookies, is_valid')
    .eq('id', 'default')
    .single();

  if (error || !data) {
    console.log('No session found in DB');
    return [];
  }

  if (!data.is_valid) {
    console.log('Session marked as invalid — cookies expired');
    return [];
  }

  return (data.cookies as CookieData[]) || [];
}

async function saveCookies(cookies: CookieData[]) {
  const { error } = await supabase
    .from('booksy_session')
    .upsert({
      id: 'default',
      cookies,
      last_used_at: new Date().toISOString(),
      is_valid: true,
    });

  if (error) {
    console.error('Error saving cookies:', error);
  }
}

async function markSessionInvalid() {
  const { error } = await supabase
    .from('booksy_session')
    .update({ is_valid: false })
    .eq('id', 'default');

  if (error) {
    console.error('Error marking session invalid:', error);
  }
}

async function getBooksyname(stylistName?: string): Promise<string | null> {
  if (!stylistName) return null;

  // Look up in booksy_stylist_mapping: internal stylist name → booksy name
  // First find the stylist by name
  const { data: stylist } = await supabase
    .from('stylists')
    .select('id')
    .ilike('name', `%${stylistName}%`)
    .limit(1)
    .single();

  if (!stylist) return null;

  // Then find the booksy mapping
  const { data: mapping } = await supabase
    .from('booksy_stylist_mapping')
    .select('booksy_name')
    .eq('stylist_id', stylist.id)
    .limit(1)
    .single();

  return mapping?.booksy_name || null;
}

// --- Discovery: save screenshot at each step ---
async function discoveryScreenshot(
  page: puppeteer.Page,
  step: string
): Promise<void> {
  if (!discoveryMode) return;
  try {
    const screenshot = await page.screenshot({ fullPage: true }) as Buffer;
    const url = await uploadScreenshot(screenshot, `discovery_${step}`);
    console.log(`[DISCOVERY] Step "${step}" screenshot: ${url}`);
  } catch (err) {
    console.error(`[DISCOVERY] Failed to capture step "${step}":`, err);
  }
}

// --- Date navigation helper ---
function formatDateForUrl(isoDate: string): string {
  const d = new Date(isoDate);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- Main sync logic ---
async function performSync(payload: SyncPayload): Promise<void> {
  const { action, bookingId, startTime, endTime, stylistName } = payload;

  console.log(`[SYNC] Starting ${action} for booking ${bookingId}`);
  console.log(`[SYNC] Time: ${startTime} - ${endTime}, Stylist: ${stylistName || 'N/A'}`);

  // Update log to processing
  await updateSyncLog(bookingId, 'processing');

  // Load cookies
  const cookies = await loadCookies();
  if (cookies.length === 0) {
    await updateSyncLog(bookingId, 'failed', 'No valid Booksy session. Please import cookies from Chrome in the admin panel.');
    return;
  }

  // Look up Booksy worker name
  const booksyWorkerName = await getBooksyname(stylistName);
  console.log(`[SYNC] Booksy worker name: ${booksyWorkerName || 'not mapped'}`);

  let browser: puppeteer.Browser | null = null;

  try {
    // Launch headless Chromium
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Set cookies
    const validCookies = cookies
      .filter((c: CookieData) => c.name && c.value && c.domain)
      .map((c: CookieData) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path || '/',
        ...(c.expires ? { expires: c.expires } : {}),
        ...(c.httpOnly !== undefined ? { httpOnly: c.httpOnly } : {}),
        ...(c.secure !== undefined ? { secure: c.secure } : {}),
        ...(c.sameSite ? { sameSite: c.sameSite } : {}),
      }));

    if (validCookies.length > 0) {
      await page.setCookie(...validCookies);
    }

    await discoveryScreenshot(page, '01_before_navigate');

    // Navigate to calendar with date
    const dateStr = formatDateForUrl(startTime);
    const calendarUrl = `${BOOKSY_CALENDAR_URL}?date=${dateStr}`;
    console.log(`[SYNC] Navigating to: ${calendarUrl}`);

    await page.goto(calendarUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await discoveryScreenshot(page, '02_after_navigate');

    // Check if we're on a login page
    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log(`[SYNC] Current URL: ${currentUrl}`);
    console.log(`[SYNC] Page title: ${pageTitle}`);

    const isLoginPage =
      currentUrl.includes('/login') ||
      currentUrl.includes('/sign-in') ||
      currentUrl.includes('/auth') ||
      (await page.$('input[type="password"]')) !== null;

    if (isLoginPage) {
      console.log('[SYNC] Login page detected — session expired');
      await markSessionInvalid();

      // Take screenshot for debugging
      const screenshot = await page.screenshot({ fullPage: true }) as Buffer;
      const screenshotUrl = await uploadScreenshot(screenshot, 'login_detected');

      await updateSyncLog(
        bookingId,
        'failed',
        'Sesja Booksy wygasła. Proszę zaktualizować cookies w panelu admina.',
        screenshotUrl || undefined
      );
      return;
    }

    // Wait for calendar to fully load
    await page.waitForTimeout(3000);
    await discoveryScreenshot(page, '03_calendar_loaded');

    // --- SELECT WORKER (if multiple) ---
    if (booksyWorkerName) {
      console.log(`[SYNC] Selecting worker: ${booksyWorkerName}`);
      // Try to find and click worker selector
      // Common patterns: sidebar with worker names, dropdown, tabs
      try {
        // Try clicking on worker name in sidebar/list
        const workerClicked = await page.evaluate((name: string) => {
          // Search for elements containing the worker name
          const allElements = document.querySelectorAll('span, div, button, a, li, td');
          for (const el of allElements) {
            const text = el.textContent?.trim();
            if (text && text.toLowerCase().includes(name.toLowerCase())) {
              // Check if it's a clickable/selectable element
              const clickable = el.closest('button, a, [role="option"], [role="tab"], label, li');
              if (clickable) {
                (clickable as HTMLElement).click();
                return true;
              }
              (el as HTMLElement).click();
              return true;
            }
          }
          return false;
        }, booksyWorkerName);

        if (workerClicked) {
          console.log(`[SYNC] Worker "${booksyWorkerName}" selected`);
          await page.waitForTimeout(1500);
        } else {
          console.log(`[SYNC] Could not find worker "${booksyWorkerName}" in UI`);
        }
      } catch (err) {
        console.log(`[SYNC] Worker selection failed:`, err);
      }
      await discoveryScreenshot(page, '04_worker_selected');
    }

    // --- PERFORM ACTION ---
    if (action === 'create_block') {
      await createTimeBlock(page, startTime, endTime);
    } else if (action === 'update_block') {
      // Delete old block, then create new one
      if (payload.oldStartTime && payload.oldEndTime) {
        await removeTimeBlock(page, payload.oldStartTime, payload.oldEndTime);
        // Navigate to new date if different
        const newDateStr = formatDateForUrl(startTime);
        const oldDateStr = formatDateForUrl(payload.oldStartTime);
        if (newDateStr !== oldDateStr) {
          const newUrl = `${BOOKSY_CALENDAR_URL}?date=${newDateStr}`;
          await page.goto(newUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          await page.waitForTimeout(2000);
        }
      }
      await createTimeBlock(page, startTime, endTime);
    } else if (action === 'remove_block') {
      await removeTimeBlock(page, startTime, endTime);
    }

    await discoveryScreenshot(page, '09_action_complete');

    // Save updated cookies
    const updatedCookies = await page.cookies();
    await saveCookies(updatedCookies as CookieData[]);

    // Mark success
    await updateSyncLog(bookingId, 'success');
    console.log(`[SYNC] Completed ${action} for booking ${bookingId}`);

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SYNC] Error during ${action}:`, errorMsg);

    // Try to take error screenshot
    let screenshotUrl: string | undefined;
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const screenshot = await pages[0].screenshot({ fullPage: true }) as Buffer;
          screenshotUrl = (await uploadScreenshot(screenshot, 'error')) || undefined;
        }
      } catch {
        // Ignore screenshot errors
      }
    }

    await updateSyncLog(bookingId, 'failed', errorMsg, screenshotUrl);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// --- Create a time block on the calendar ---
async function createTimeBlock(
  page: puppeteer.Page,
  startTime: string,
  endTime: string
): Promise<void> {
  console.log(`[SYNC] Creating time block: ${startTime} - ${endTime}`);
  await discoveryScreenshot(page, '05_before_create_block');

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const startHour = startDate.getHours();
  const startMinutes = startDate.getMinutes();
  const endHour = endDate.getHours();
  const endMinutes = endDate.getMinutes();

  // Strategy 1: Try to find "Add blocked time" or similar button
  // Common Booksy Pro patterns: fab button, context menu on calendar cell, "+" button
  const blockCreated = await page.evaluate(
    (sH: number, sM: number, eH: number, eM: number) => {
      // Look for "blocked time", "blokada", "zablokuj", "busy time" buttons
      const patterns = [
        'blokad', 'zablokuj', 'blocked', 'busy', 'przerw',
        'block time', 'add block', 'dodaj blokad'
      ];

      const allButtons = document.querySelectorAll('button, a, [role="button"], [role="menuitem"]');
      for (const btn of allButtons) {
        const text = (btn.textContent || '').toLowerCase().trim();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        for (const pattern of patterns) {
          if (text.includes(pattern) || ariaLabel.includes(pattern)) {
            (btn as HTMLElement).click();
            return { clicked: true, text: btn.textContent?.trim() };
          }
        }
      }

      return { clicked: false, text: null };
    },
    startHour, startMinutes, endHour, endMinutes
  );

  if (blockCreated.clicked) {
    console.log(`[SYNC] Clicked button: "${blockCreated.text}"`);
    await page.waitForTimeout(2000);
    await discoveryScreenshot(page, '06_block_dialog_open');

    // Try to fill time fields
    await fillTimeFields(page, startHour, startMinutes, endHour, endMinutes);
    await discoveryScreenshot(page, '07_times_filled');

    // Try to save/confirm
    await clickSaveButton(page);
    await page.waitForTimeout(2000);
    await discoveryScreenshot(page, '08_block_saved');
  } else {
    console.log('[SYNC] Could not find "add block" button. Trying calendar cell click...');
    await discoveryScreenshot(page, '05b_no_button_found');

    // Strategy 2: Click on the calendar at the right time
    // This is a fallback — click on the time grid
    const cellClicked = await page.evaluate((hour: number) => {
      // Try to find a time cell for the given hour
      const timeCells = document.querySelectorAll(
        '[data-time], [data-hour], .calendar-cell, .time-slot, .fc-timegrid-slot'
      );
      for (const cell of timeCells) {
        const timeAttr = cell.getAttribute('data-time') || cell.getAttribute('data-hour');
        if (timeAttr && parseInt(timeAttr) === hour) {
          (cell as HTMLElement).click();
          return true;
        }
      }

      // Fallback: look for time labels like "10:00", "11:00"
      const timeLabels = document.querySelectorAll('td, div, span');
      for (const label of timeLabels) {
        const text = label.textContent?.trim();
        if (text === `${hour}:00` || text === `${String(hour).padStart(2, '0')}:00`) {
          // Click the adjacent cell or the label itself
          const row = label.closest('tr, [role="row"]');
          if (row) {
            const cells = row.querySelectorAll('td, [role="gridcell"]');
            if (cells.length > 1) {
              (cells[1] as HTMLElement).click();
              return true;
            }
          }
          (label as HTMLElement).click();
          return true;
        }
      }
      return false;
    }, startHour);

    if (cellClicked) {
      console.log(`[SYNC] Clicked calendar cell at hour ${startHour}`);
      await page.waitForTimeout(2000);
      await discoveryScreenshot(page, '06b_cell_clicked');

      // Look for "blocked time" option in context menu
      const menuClicked = await page.evaluate(() => {
        const patterns = ['blokad', 'zablokuj', 'blocked', 'busy', 'przerw'];
        const menuItems = document.querySelectorAll(
          '[role="menuitem"], [role="option"], li, button, a'
        );
        for (const item of menuItems) {
          const text = (item.textContent || '').toLowerCase();
          for (const pattern of patterns) {
            if (text.includes(pattern)) {
              (item as HTMLElement).click();
              return true;
            }
          }
        }
        return false;
      });

      if (menuClicked) {
        await page.waitForTimeout(2000);
        await fillTimeFields(page, startHour, startMinutes, endHour, endMinutes);
        await clickSaveButton(page);
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('[SYNC] Could not find calendar cell to click');
    }
  }
}

// --- Fill time input fields ---
async function fillTimeFields(
  page: puppeteer.Page,
  startHour: number,
  startMinutes: number,
  endHour: number,
  endMinutes: number
): Promise<void> {
  const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;
  const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

  console.log(`[SYNC] Filling times: ${startTimeStr} - ${endTimeStr}`);

  // Try various selectors for time inputs
  await page.evaluate(
    (start: string, end: string) => {
      // Strategy 1: input[type="time"]
      const timeInputs = document.querySelectorAll('input[type="time"]');
      if (timeInputs.length >= 2) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        )?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(timeInputs[0], start);
          timeInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          timeInputs[0].dispatchEvent(new Event('change', { bubbles: true }));

          nativeInputValueSetter.call(timeInputs[1], end);
          timeInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
          timeInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
        }
        return;
      }

      // Strategy 2: inputs with start/end labels
      const allInputs = document.querySelectorAll('input');
      for (const input of allInputs) {
        const label = input.getAttribute('aria-label')?.toLowerCase() || '';
        const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
        const name = input.getAttribute('name')?.toLowerCase() || '';
        const id = input.getAttribute('id')?.toLowerCase() || '';
        const combined = `${label} ${placeholder} ${name} ${id}`;

        if (
          combined.includes('start') || combined.includes('od') ||
          combined.includes('from') || combined.includes('począt')
        ) {
          input.value = start;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (
          combined.includes('end') || combined.includes('do') ||
          combined.includes('to') || combined.includes('koniec') ||
          combined.includes('końc')
        ) {
          input.value = end;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    },
    startTimeStr, endTimeStr
  );
}

// --- Click save/confirm button ---
async function clickSaveButton(page: puppeteer.Page): Promise<void> {
  const saved = await page.evaluate(() => {
    const patterns = ['zapisz', 'save', 'potwierdź', 'confirm', 'ok', 'zatwierdź', 'dodaj', 'add'];
    const buttons = document.querySelectorAll('button, [role="button"], input[type="submit"]');
    for (const btn of buttons) {
      const text = (btn.textContent || '').toLowerCase().trim();
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      for (const pattern of patterns) {
        if (text === pattern || ariaLabel.includes(pattern)) {
          (btn as HTMLElement).click();
          return text;
        }
      }
    }
    // Broader match
    for (const btn of buttons) {
      const text = (btn.textContent || '').toLowerCase().trim();
      for (const pattern of patterns) {
        if (text.includes(pattern)) {
          (btn as HTMLElement).click();
          return text;
        }
      }
    }
    return null;
  });

  if (saved) {
    console.log(`[SYNC] Clicked save button: "${saved}"`);
  } else {
    console.log('[SYNC] Could not find save button');
  }
}

// --- Remove a time block from the calendar ---
async function removeTimeBlock(
  page: puppeteer.Page,
  startTime: string,
  endTime: string
): Promise<void> {
  console.log(`[SYNC] Removing time block: ${startTime} - ${endTime}`);

  const startDate = new Date(startTime);
  const startHour = startDate.getHours();
  const startMinutes = startDate.getMinutes();
  const startTimeStr = `${String(startHour).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')}`;

  await discoveryScreenshot(page, '05_before_remove_block');

  // Try to find an existing block at this time and click it
  const blockFound = await page.evaluate((timeStr: string, hour: number) => {
    // Look for blocked time elements containing the time
    const allElements = document.querySelectorAll(
      '.blocked, .busy, [data-blocked], [class*="block"], [class*="busy"], [class*="break"]'
    );
    for (const el of allElements) {
      const text = el.textContent || '';
      if (text.includes(timeStr) || text.includes(`${hour}:`)) {
        (el as HTMLElement).click();
        return true;
      }
    }

    // Fallback: look for any element with the time text that looks like a block
    const spans = document.querySelectorAll('div, span');
    for (const span of spans) {
      const text = span.textContent?.trim() || '';
      const parentClass = (span.parentElement?.className || '').toLowerCase();
      if (
        (text.includes(timeStr) || text.includes(`${hour}:`)) &&
        (parentClass.includes('block') || parentClass.includes('busy') || parentClass.includes('event'))
      ) {
        (span as HTMLElement).click();
        return true;
      }
    }

    return false;
  }, startTimeStr, startHour);

  if (blockFound) {
    console.log(`[SYNC] Found and clicked time block at ${startTimeStr}`);
    await page.waitForTimeout(2000);
    await discoveryScreenshot(page, '06_block_clicked_for_delete');

    // Look for delete button
    const deleted = await page.evaluate(() => {
      const patterns = ['usuń', 'delete', 'remove', 'cancel', 'anuluj', 'kasuj'];
      const buttons = document.querySelectorAll('button, [role="button"], a');
      for (const btn of buttons) {
        const text = (btn.textContent || '').toLowerCase().trim();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        for (const pattern of patterns) {
          if (text.includes(pattern) || ariaLabel.includes(pattern)) {
            (btn as HTMLElement).click();
            return text;
          }
        }
      }
      return null;
    });

    if (deleted) {
      console.log(`[SYNC] Clicked delete button: "${deleted}"`);
      await page.waitForTimeout(1500);

      // Confirm deletion if prompted
      const confirmed = await page.evaluate(() => {
        const patterns = ['potwierdź', 'tak', 'yes', 'confirm', 'ok', 'usuń'];
        const buttons = document.querySelectorAll('button, [role="button"]');
        for (const btn of buttons) {
          const text = (btn.textContent || '').toLowerCase().trim();
          for (const pattern of patterns) {
            if (text.includes(pattern)) {
              (btn as HTMLElement).click();
              return true;
            }
          }
        }
        return false;
      });

      if (confirmed) {
        console.log('[SYNC] Deletion confirmed');
      }

      await page.waitForTimeout(2000);
      await discoveryScreenshot(page, '07_block_deleted');
    } else {
      console.log('[SYNC] Could not find delete button');
    }
  } else {
    console.log(`[SYNC] Could not find time block at ${startTimeStr} to remove`);
  }
}

// --- Handler ---
const handler: Handler = async (event: HandlerEvent) => {
  // Background functions only accept POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Parse payload
  let payload: SyncPayload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Validate secret
  if (!syncSecret || payload.secret !== syncSecret) {
    console.log('[SYNC] Invalid secret');
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // Validate required fields
  if (!payload.action || !payload.bookingId || !payload.startTime || !payload.endTime) {
    return { statusCode: 400, body: 'Missing required fields: action, bookingId, startTime, endTime' };
  }

  console.log(`[SYNC] Received ${payload.action} request for booking ${payload.bookingId}`);

  // Perform sync (this runs in the background — up to 15 minutes)
  try {
    await performSync(payload);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SYNC] Unhandled error:`, errorMsg);
    await updateSyncLog(payload.bookingId, 'failed', `Unhandled error: ${errorMsg}`);
  }

  // Background functions return 202 automatically before this point,
  // but we return 200 in case it's called synchronously during testing
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};

export { handler };
