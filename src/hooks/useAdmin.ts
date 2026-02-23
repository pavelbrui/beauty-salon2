import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UseAdminReturn {
  isAdmin: boolean;
  isLoading: boolean;
  user: any | null;
}

const AUTH_TIMEOUT_MS = 50000;

async function checkIsAdmin(userId: string, appMetadataRole?: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  if (data?.role === 'admin') return true;
  if (appMetadataRole === 'admin') return true;
  return false;
}

export const useAdmin = (): UseAdminReturn => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (isMounted) {
            setUser(null);
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }

        const userPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timed out')), AUTH_TIMEOUT_MS)
        );

        const { data: { user: currentUser } } = await Promise.race([userPromise, timeoutPromise]);
        if (!isMounted) return;
        if (currentUser) {
          setUser(currentUser);
          const admin = await checkIsAdmin(currentUser.id, currentUser.app_metadata?.role);
          if (isMounted) setIsAdmin(admin);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('checkAdmin error:', err);
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser(session.user);
        const admin = await checkIsAdmin(session.user.id, session.user.app_metadata?.role);
        if (isMounted) setIsAdmin(admin);
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
