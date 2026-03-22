import type { Handler, HandlerEvent } from '@netlify/functions';
import { isRateLimited, getClientIp } from './utils/rateLimit';

const resendApiKey = process.env.RESEND_API_KEY || '';

const ADMIN_EMAIL = 'brui.katarzyna@gmail.com';
const DEVELOPER_EMAIL = 'bpl_as@mail.ru';
const FROM_EMAIL = 'Katarzyna Brui <studio@katarzynabrui.pl>';

interface RegistrationPayload {
  email: string;
  provider: 'email' | 'google';
}

function registrationNotificationHtml(userEmail: string, provider: string): string {
  const now = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:16px;">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:20px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:white;margin:0;font-size:20px;">Katarzyna Brui Studio</h1>
    <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:13px;">Nowa rejestracja</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
    <h2 style="color:#d97706;margin:0 0 16px;">Nowy uzytkownik zarejestrowany!</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#666;width:110px;">Email:</td><td style="font-weight:600;">${userEmail}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Metoda:</td><td>${provider === 'google' ? 'Google OAuth' : 'Email + haslo'}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Data:</td><td>${now}</td></tr>
    </table>
    <p style="margin-top:16px;"><a href="https://katarzynabrui.pl/admin" style="color:#f59e0b;">Otworz panel admina</a></p>
  </div>
</div>`;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const ip = getClientIp(event.headers);
  if (isRateLimited(ip, 5, 60_000)) {
    return { statusCode: 429, body: 'Too many requests' };
  }

  let payload: RegistrationPayload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!payload.email) {
    return { statusCode: 400, body: 'Missing email' };
  }

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return { statusCode: 500, body: 'Email service not configured' };
  }

  const html = registrationNotificationHtml(payload.email, payload.provider || 'email');
  const subject = `Nowa rejestracja: ${payload.email}`;
  const recipients = [ADMIN_EMAIL, DEVELOPER_EMAIL];

  const results: Array<{ to: string; ok: boolean; error?: string }> = [];

  for (const to of recipients) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`Resend error for ${to}:`, errBody);
        results.push({ to, ok: false, error: errBody });
      } else {
        console.log(`Registration email sent to ${to}`);
        results.push({ to, ok: true });
      }
    } catch (fetchErr) {
      console.error(`Fetch error for ${to}:`, fetchErr);
      results.push({ to, ok: false, error: String(fetchErr) });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, results }),
  };
};
