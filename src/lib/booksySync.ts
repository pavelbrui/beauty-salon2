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
  } catch (err) {
    console.error('Booksy sync error:', err);
  }
}
