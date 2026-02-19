import { supabase } from './supabase';
import { saveUserData } from '../utils/cookies';

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
}

/**
 * Load profile from DB. Falls back to empty fields.
 */
export const loadProfile = async (): Promise<UserProfile | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, email')
    .eq('id', session.user.id)
    .single();

  if (error || !data) {
    // Profile row might not exist yet (user registered before migration).
    // Create one on the fly.
    const { data: created } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        email: session.user.email || null
      })
      .select('id, full_name, phone, email')
      .single();
    return created || null;
  }

  return data;
};

/**
 * Save contact data to profiles table AND cookies (for offline pre-fill).
 */
export const saveProfile = async (fields: {
  full_name?: string;
  phone?: string;
  email?: string;
}): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: session.user.id,
      ...fields,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving profile:', error);
    return false;
  }

  // Also sync to cookies for offline pre-fill
  saveUserData({
    name: fields.full_name,
    phone: fields.phone,
    email: fields.email
  });

  return true;
};
