import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAdmin, isLoading, error, refresh } = useAdmin();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-md w-full p-6">
          <h2 className="text-lg font-semibold text-gray-900">Nie udało się załadować panelu admina</h2>
          <p className="mt-2 text-sm text-gray-600">
            Nie udało się zweryfikować uprawnień administratora. Sprawdź połączenie i spróbuj ponownie.
          </p>
          <p className="mt-3 text-xs text-gray-400 break-words">{error}</p>
          <div className="mt-5 flex gap-3 justify-end">
            <button
              onClick={() => refresh()}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Spróbuj ponownie
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm font-medium"
            >
              Odśwież stronę
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
