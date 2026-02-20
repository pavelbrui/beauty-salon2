import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UseAdminReturn {
  isAdmin: boolean;
  isLoading: boolean;
  user: any | null;
}

const AUTH_TIMEOUT_MS = 50000;

export const useAdmin = (): UseAdminReturn => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      try {
        // First try getSession() — fast, uses local cache
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (isMounted) {
            setUser(null);
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }

        // Session exists — verify with getUser() but with a timeout
        const userPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timed out')), AUTH_TIMEOUT_MS)
        );

        const { data: { user: currentUser } } = await Promise.race([userPromise, timeoutPromise]);
        if (isMounted) {
          if (currentUser) {
            setUser(currentUser);
            setIsAdmin(currentUser.app_metadata?.role === 'admin');
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        }
      } catch (err) {
        console.error('checkAdmin error:', err);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        setIsAdmin(session.user.app_metadata?.role === 'admin');
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isLoading, user };
};
