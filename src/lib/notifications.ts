import { supabase } from './supabase';

export const ADMIN_EMAIL = 'bpl_as2@mail.ru';

export const notifyAdmin = async (
  bookingId: string,
  action: 'cancelled' | 'rescheduled' | 'rebooked' | 'deleted',
  message: string
) => {
  const { error } = await supabase
    .from('admin_notifications')
    .insert({
      booking_id: bookingId,
      action,
      admin_email: ADMIN_EMAIL,
      message
    });

  if (error) {
    console.error('Error creating admin notification:', error);
  }
};

export const notifyClient = async (
  bookingId: string,
  type: 'confirmation' | 'reminder' | 'status_update'
) => {
  const { error } = await supabase
    .from('booking_notifications')
    .insert({
      booking_id: bookingId,
      type,
      status: 'pending'
    });

  if (error) {
    console.error('Error creating client notification:', error);
  }
};

/**
 * Fire-and-forget: sends a real email via Netlify Function + Resend.
 * Authenticates via the user's Supabase JWT — no shared secret in frontend.
 */
export const sendBookingEmail = async (
  bookingId: string,
  type: 'confirmation' | 'cancellation' | 'reschedule' | 'deleted',
  extraMessage?: string,
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.warn('No auth session — email notifications skipped');
      return;
    }

    fetch('/.netlify/functions/send-booking-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, type, authToken: session.access_token, extraMessage }),
    }).catch(() => {
      // fire-and-forget: don't block the user flow
    });
  } catch (err) {
    console.error('Email notification error:', err);
  }
};
