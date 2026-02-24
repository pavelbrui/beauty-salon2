import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { withTimeout } from '../utils/withTimeout';

interface UseAdminReturn {
  isAdmin: boolean;
  isLoading: boolean;
  user: any | null;
  error: string | null;
  refresh: () => void;
}

const AUTH_TIMEOUT_MS = 20000;
const ADMIN_CHECK_TIMEOUT_MS = 15000;

async function checkIsAdmin(userId: string, appMetadataRole?: string): Promise<boolean> {
  // Prefer JWT/app_metadata role to avoid blocking admin access on DB/RLS/network hiccups.
  if (appMetadataRole === 'admin') return true;

  const { data, error } = await withTimeout(
    supabase.from('profiles').select('role').eq('id', userId).single(),
    ADMIN_CHECK_TIMEOUT_MS,
    'Admin role check timed out'
  );

  if (error) {
    console.error('Error checking admin role:', error);
    return false;
  }

  return data?.role === 'admin';
}

export const useAdmin = (): UseAdminReturn => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resolveFromSession = async (session: any | null) => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);

      if (!session?.user) {
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        setUser(session.user);
        const admin = await checkIsAdmin(session.user.id, session.user.app_metadata?.role);
        if (isMounted) setIsAdmin(admin);
      } catch (err) {
        console.error('resolveFromSession error:', err);
        if (isMounted) {
          setIsAdmin(false);
          setError(err instanceof Error ? err.message : 'Nie udało się sprawdzić uprawnień');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const initialCheck = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!data.session) {
          if (isMounted) {
            setUser(null);
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }

        const { data: userData, error: userError } = await withTimeout(
          supabase.auth.getUser(),
          AUTH_TIMEOUT_MS,
          'Auth check timed out'
        );
        if (userError) throw userError;

        const currentUser = userData.user ?? data.session.user;
        if (!isMounted) return;

        setUser(currentUser ?? null);
        if (currentUser) {
          const admin = await checkIsAdmin(currentUser.id, currentUser.app_metadata?.role);
          if (isMounted) setIsAdmin(admin);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('checkAdmin error:', err);
        if (isMounted) {
          setIsAdmin(false);
          setError(err instanceof Error ? err.message : 'Nie udało się sprawdzić uprawnień');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initialCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await resolveFromSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(() => {
    // Best-effort re-check; hook will still receive auth state events.
    setIsLoading(true);
    setError(null);
    supabase.auth.getSession()
      .then(({ data }) => {
        if (!data.session?.user) {
          setUser(null);
          setIsAdmin(false);
          return;
        }
        setUser(data.session.user);
        return checkIsAdmin(data.session.user.id, data.session.user.app_metadata?.role).then(setIsAdmin);
      })
      .catch((err) => {
        console.error('refresh admin check error:', err);
        setIsAdmin(false);
        setError(err instanceof Error ? err.message : 'Nie udało się sprawdzić uprawnień');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { isAdmin, isLoading, user, error, refresh };
};
