import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UseAdminReturn {
  isAdmin: boolean;
  isLoading: boolean;
  user: any | null;
}

export const useAdmin = (): UseAdminReturn => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // getUser() fetches fresh user data from auth server (not cached JWT)
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
          const role = currentUser.app_metadata?.role;
          setIsAdmin(role === 'admin');
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('checkAdmin error:', err);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Fetch fresh user data on auth state change too
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        if (freshUser) {
          setUser(freshUser);
          setIsAdmin(freshUser.app_metadata?.role === 'admin');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, isLoading, user };
};
