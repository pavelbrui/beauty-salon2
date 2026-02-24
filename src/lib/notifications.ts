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
 * Follows the same pattern as syncBookingToBooksy.
 */
export const sendBookingEmail = (
  bookingId: string,
  type: 'confirmation' | 'cancellation' | 'reschedule' | 'deleted',
  extraMessage?: string,
) => {
  try {
    const secret = import.meta.env.VITE_NOTIFICATION_SECRET;
    if (!secret) {
      console.warn('VITE_NOTIFICATION_SECRET not set — email notifications disabled');
      return;
    }

    fetch('/.netlify/functions/send-booking-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, type, secret, extraMessage }),
    }).catch(() => {
      // fire-and-forget: don't block the user flow
    });
  } catch (err) {
    console.error('Email notification error:', err);
  }
};
