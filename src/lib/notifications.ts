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
