import { supabase } from './supabase';

/**
 * Delete email logs older than the specified number of days.
 */
export async function deleteOldEmailLogs(days: number = 10) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const iso = cutoff.toISOString();
  const { error } = await supabase
    .from('booksy_email_log')
    .delete()
    .lt('received_at', iso);
  if (error) {
    console.error('Failed to delete old email logs:', error);
    throw error;
  }
}

/**
 * Delete sync logs older than the specified number of days.
 */
export async function deleteOldSyncLogs(days: number = 10) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const iso = cutoff.toISOString();
  const { error } = await supabase
    .from('booksy_sync_log')
    .delete()
    .lt('created_at', iso);
  if (error) {
    console.error('Failed to delete old sync logs:', error);
    throw error;
  }
}

/**
 * Convenience wrapper to clean both email and sync logs.
 */
export async function cleanOldLogs(days: number = 10) {
  await Promise.all([deleteOldEmailLogs(days), deleteOldSyncLogs(days)]);
}
