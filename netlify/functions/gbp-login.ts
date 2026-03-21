import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

/**
 * Google Business Profile Login — one-time manual cookie capture.
 *
 * Flow:
 * 1. POST /api/gbp-login with { email, password } in body
 * 2. Puppeteer opens Google login, enters credentials
 * 3. If 2FA is required, call again with { code: "123456" } to complete
 * 4. Cookies are saved to google_business_sessions table
 *
 * After first login, instagram-sync uses saved cookies automatically.
 * Cookies are refreshed on each use to extend session lifetime.
 */

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const loginSecret = process.env.GBP_LOGIN_SECRET || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Protect with a secret
  const authHeader = event.headers['x-gbp-secret'] || '';
  if (!loginSecret || authHeader !== loginSecret) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized. Set x-gbp-secret header.' }) };
  }

  const body = JSON.parse(event.body || '{}');
  const { email, password, code } = body;

  if (!email && !code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Provide { email, password } for login or { code } for 2FA' }),
    };
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 900 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);

    // If we have existing cookies (for 2FA step), load them
    if (code) {
      const { data: session } = await supabase
        .from('google_business_sessions')
        .select('cookies')
        .eq('is_valid', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (session?.cookies) {
        await page.setCookie(...(session.cookies as puppeteer.CookieParam[]));
      }

      // Navigate to Google and enter 2FA code
      await page.goto('https://accounts.google.com', { waitUntil: 'networkidle2', timeout: 30000 });

      // Try to find 2FA input
      const codeInput = await page.$('input[type="tel"]') || await page.$('#totpPin') || await page.$('input[name="totpPin"]');
      if (codeInput) {
        await codeInput.type(code, { delay: 50 });
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      }
    } else {
      // Fresh login
      await page.goto('https://accounts.google.com/signin', { waitUntil: 'networkidle2', timeout: 30000 });

      // Enter email
      const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      if (emailInput) {
        await emailInput.type(email, { delay: 30 });
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));
      }

      // Enter password
      const passInput = await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      if (passInput) {
        await passInput.type(password, { delay: 30 });
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // Check if we're on a 2FA page
    const currentUrl = page.url();
    const pageContent = await page.content();
    const needs2FA = currentUrl.includes('challenge') ||
                     currentUrl.includes('signin/v2') ||
                     pageContent.includes('2-Step Verification') ||
                     pageContent.includes('totpPin');

    // Save cookies
    const cookies = await page.cookies();

    if (needs2FA && !code) {
      // Save partial session for 2FA completion
      await supabase.from('google_business_sessions').insert({
        cookies,
        user_agent: USER_AGENT,
        is_valid: false,
        error_message: 'Awaiting 2FA code',
      });

      return {
        statusCode: 200,
        body: JSON.stringify({
          status: '2fa_required',
          message: 'Login succeeded, but 2FA is required. Call again with { "code": "123456" }',
        }),
      };
    }

    // Check if login was successful (we should be on myaccount or google.com)
    const loggedIn = currentUrl.includes('myaccount.google.com') ||
                     currentUrl.includes('google.com/') && !currentUrl.includes('signin');

    if (!loggedIn) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: 'login_failed',
          currentUrl,
          message: 'Login did not complete. Check credentials or handle additional verification.',
        }),
      };
    }

    // Also navigate to business.google.com to get those cookies
    await page.goto('https://business.google.com/', { waitUntil: 'networkidle2', timeout: 20000 });
    const allCookies = await page.cookies();

    // Save valid session — upsert: delete old, insert new
    await supabase.from('google_business_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('google_business_sessions').insert({
      cookies: allCookies,
      user_agent: USER_AGENT,
      is_valid: true,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        message: `Logged in successfully. ${allCookies.length} cookies saved. Instagram sync will now post to GBP automatically.`,
        cookieCount: allCookies.length,
      }),
    };
  } catch (error) {
    console.error('GBP login error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Login failed',
        message: error instanceof Error ? error.message : String(error),
      }),
    };
  } finally {
    await browser.close();
  }
};
