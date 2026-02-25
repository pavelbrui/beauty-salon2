import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
}

const ROLES = ['admin', 'client', 'moderator', 'stylist'] as const;

export const AdminUsers: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, role, created_at')
      .order('created_at', { ascending: false });

    if (err) {
      console.error('Error loading profiles:', err);
      setError(err.message);
      setProfiles([]);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const updateRole = async (profileId: string, newRole: string) => {
    setSavingId(profileId);
    setError(null);
    const { error: err } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);

    if (err) {
      console.error('Error updating role:', err);
      setError(err.message);
    } else {
      setProfiles(prev =>
        prev.map(p => (p.id === profileId ? { ...p, role: newRole } : p))
      );
    }
    setSavingId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Zarządzaj rolami użytkowników. Rola <strong>admin</strong> daje dostęp do panelu administracyjnego.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imię</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rola</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Akcje</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {profiles.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{p.email || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{p.full_name || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{p.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                      p.role === 'admin'
                        ? 'bg-rose-100 text-rose-800'
                        : p.role === 'moderator'
                        ? 'bg-blue-100 text-blue-800'
                        : p.role === 'stylist'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {p.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={p.role}
                    onChange={(e) => updateRole(p.id, e.target.value)}
                    disabled={savingId === p.id}
                    className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-rose-500 focus:border-rose-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {profiles.length === 0 && (
        <p className="text-gray-500 text-center py-8">Brak profili użytkowników.</p>
      )}
    </div>
  );
};
