import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthModal } from './AuthModal';

interface AuthRouteProps {
  children: React.ReactNode;
}

export const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pt-16 min-h-screen bg-neutral-50">
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          mode="signin"
          onSuccess={() => {}}
        />
      </div>
    );
  }

  return <>{children}</>;
};
