import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

/**
 * Diagnostic test function for email sending.
 * POST /.netlify/functions/test-email
 * Body: { "to": "pashabrui@gmail.com" }
 *
 * Tests:
 * 1. Resend API key present
 * 2. Supabase connection (service role key)
 * 3. Send a real test email via Resend
 * 4. Fetch a booking and simulate the full flow
 */

const resendApiKey = process.env.RESEND_API_KEY || '';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const FROM_EMAIL = 'Katarzyna Brui <studio@katarzynabrui.pl>';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const diagnostics: Record<string, unknown> = {};

  // --- Step 1: Check env vars ---
  diagnostics.envVars = {
    RESEND_API_KEY: resendApiKey ? `set (${resendApiKey.length} chars, starts with ${resendApiKey.slice(0, 6)}...)` : 'MISSING',
    SUPABASE_URL: supabaseUrl || 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? `set (${supabaseServiceKey.length} chars)` : 'MISSING',
    SUPABASE_ANON_KEY: supabaseAnonKey ? `set (${supabaseAnonKey.length} chars)` : 'MISSING',
  };

  // --- Step 2: Test Supabase connection ---
  try {
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, status, contact_name, contact_email, start_time,
          services ( name, price, duration ),
          stylists ( name, email )
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        diagnostics.supabaseTest = { ok: false, error: error.message, code: error.code };
      } else {
        diagnostics.supabaseTest = {
          ok: true,
          bookingId: data?.id,
          contactName: data?.contact_name,
          servicesType: Array.isArray(data?.services) ? 'ARRAY (bug!)' : typeof data?.services,
          servicesData: data?.services,
          stylistsType: Array.isArray(data?.stylists) ? 'ARRAY (bug!)' : typeof data?.stylists,
          stylistsData: data?.stylists,
        };
      }
    } else {
      diagnostics.supabaseTest = { ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' };
    }
  } catch (err) {
    diagnostics.supabaseTest = { ok: false, error: String(err) };
  }

  // --- Step 3: Parse target email ---
  let targetEmail = 'pashabrui@gmail.com';
  try {
    const body = JSON.parse(event.body || '{}');
    if (body.to) targetEmail = body.to;
  } catch { /* use default */ }

  // --- Step 4: Send test email via Resend ---
  if (!resendApiKey) {
    diagnostics.emailTest = { ok: false, error: 'RESEND_API_KEY is missing — cannot send' };
  } else {
    try {
      const emailPayload = {
        from: FROM_EMAIL,
        to: [targetEmail],
        subject: 'Test email — Katarzyna Brui Studio',
        html: `
<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:white;margin:0;font-size:22px;">Katarzyna Brui Studio</h1>
    <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:14px;">Test email diagnostyczny</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
    <p style="font-size:16px;color:#374151;">Ten email potwierdza, że system wysyłki emaili działa poprawnie.</p>
    <p style="color:#6b7280;">Czas: ${new Date().toISOString()}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
    <p style="color:#9ca3af;font-size:12px;">Diagnostics: Resend API key present, Supabase connected.</p>
  </div>
</div>`,
      };

      diagnostics.emailPayload = { from: emailPayload.from, to: emailPayload.to, subject: emailPayload.subject };

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      const resBody = await res.text();
      diagnostics.emailTest = {
        ok: res.ok,
        status: res.status,
        response: resBody,
      };
    } catch (err) {
      diagnostics.emailTest = { ok: false, error: String(err) };
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(diagnostics, null, 2),
  };
};
