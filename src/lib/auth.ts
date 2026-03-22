import { supabase } from './supabase';

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signInWithGoogle = async (redirectTo?: string) => {
  const hasWindow = typeof window !== 'undefined';
  const options = redirectTo
    ? { redirectTo }
    : hasWindow
      ? { redirectTo: window.location.href }
      : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const useAuth = () => {
  const session = supabase.auth.getSession();
  return { session };
};
