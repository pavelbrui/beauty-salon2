/*
 * Booksy Sync Utility
 * -------------------
 * This module handles synchronising booking data from our application to the Booksy Pro
 * calendar via a fire‑and‑forget Netlify background function. The flow is:
 *   1️⃣ Look up optional stylist details from the `stylists` table.
 *   2️⃣ Insert a pending record into `booksy_sync_log` for audit / retry purposes.
 *   3️⃣ Retrieve the current Supabase session JWT (required for authenticating the
 *      background function).
 *   4️⃣ POST the sync payload to the Netlify function `/.netlify/functions/booksy-sync-background`.
 *      The function validates the JWT, contacts Booksy, and updates the log entry with the
 *      result.
 *
 * The function is deliberately fire‑and‑forget – any failure is logged to the console but
 * does not block the user experience. Errors are captured by the surrounding `try/catch`.
 */
import { supabase } from './supabase';

/**
 * Fire-and-forget helper to sync a booking to Booksy Pro calendar.
 * Inserts a sync_log record and calls the Netlify Background Function.
 * Follows the same pattern as notifyAdmin/notifyClient.
 */
export async function syncBookingToBooksy(params: {
  action: 'create_block' | 'update_block' | 'remove_block';
  bookingId: string;
  startTime: string;
  endTime: string;
  stylistId?: string | null;
  oldStartTime?: string;
  oldEndTime?: string;
}) {
  try {
    // Look up stylist name for logging and for background function
    let stylistName: string | undefined;
    if (params.stylistId) {
      const { data } = await supabase
        .from('stylists')
        .select('name')
        .eq('id', params.stylistId)
        .single();
      stylistName = data?.name || undefined;
    }

    // 1. Insert sync_log record (pending)
    const { error } = await supabase.from('booksy_sync_log').insert({
      booking_id: params.bookingId,
      action: params.action,
      start_time: params.startTime,
      end_time: params.endTime,
      stylist_name: stylistName,
    });

    if (error) {
      console.error('Error inserting booksy_sync_log:', error);
    }

    // 2. Fire background function (returns 202 immediately)
    // Authenticate via Supabase JWT — no shared secret in frontend
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.warn('No auth session — Booksy sync skipped');
      return;
    }

    fetch('/.netlify/functions/booksy-sync-background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: params.action,
        bookingId: params.bookingId,
        startTime: params.startTime,
        endTime: params.endTime,
        stylistName,
        oldStartTime: params.oldStartTime,
        oldEndTime: params.oldEndTime,
        authToken: session.access_token,
      }),
    }).catch(() => {
      // fire-and-forget: don't block the user flow
    });

    // Additionally: if this booking's service is configured as a complex service,
    // create a parallel sync_log entry for the additional stylist.
    try {
      const { data: complex } = await supabase
        .from('booksy_complex_services')
        .select('additional_stylist_id')
        .eq('is_active', true)
        .maybeSingle();

      if (complex?.additional_stylist_id) {
        // Insert a separate sync log for the additional stylist (create_block/update_block/remove_block)
        await supabase.from('booksy_sync_log').insert({
          booking_id: params.bookingId,
          action: params.action,
          start_time: params.startTime,
          end_time: params.endTime,
          stylist_name: undefined,
        });
        // Fire background function to handle additional stylist (fire-and-forget)
        fetch('/.netlify/functions/booksy-sync-background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: params.action,
            bookingId: params.bookingId,
            startTime: params.startTime,
            endTime: params.endTime,
            stylistName: undefined,
            oldStartTime: params.oldStartTime,
            oldEndTime: params.oldEndTime,
            authToken: session.access_token,
          }),
        }).catch(() => {});
      }
    } catch (err) {
      // Non-fatal
      console.warn('Error checking complex service for dual sync:', err);
    }
  } catch (err) {
    console.error('Booksy sync error:', err);
  }
}
