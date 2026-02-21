import React, { useState, useEffect } from 'react';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';
import { supabase } from '../lib/supabase';
import { loadProfile, saveProfile, UserProfile } from '../lib/profile';
import { signOut } from '../lib/auth';
import { SEO } from '../components/SEO';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { UserBookings } from '../components/UserBookings';
import { format } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import {
  UserIcon,
  ArrowRightOnRectangleIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const dateLocales = { pl, en: enUS, ru };

export const ProfilePage: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const navigate = useLocalizedNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    setUserEmail(session.user.email || '');
    if (session.user.created_at) {
      const locale = dateLocales[language as keyof typeof dateLocales] || pl;
      setMemberSince(format(new Date(session.user.created_at), 'LLLL yyyy', { locale }));
    }

    const profileData = await loadProfile();
    if (profileData) {
      setProfile(profileData);
      setProfileForm({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        email: profileData.email || session.user.email || ''
      });
    }

    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const ok = await saveProfile(profileForm);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setEditingProfile(false);
      setProfile(prev => prev ? { ...prev, ...profileForm } : prev);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSignOut = async () => {
    if (!confirm(t.profile_page?.signOutConfirm || 'Are you sure?')) return;
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <main className="pt-16 min-h-screen bg-neutral-50">
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 min-h-screen bg-neutral-50">
      <SEO
        title={t.profile_page?.title || 'Mój Profil'}
        description={t.profile_page?.seoDescription || 'Zarządzaj swoimi rezerwacjami.'}
        canonical="/profile"
        noindex
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="h-24 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500" />
          <div className="px-6 pb-6 -mt-10">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center ring-4 ring-white">
                <span className="text-2xl font-bold text-amber-600">
                  {(profile?.full_name || userEmail || '?')[0].toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0 sm:pb-1">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  {profile?.full_name || userEmail}
                </h1>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <EnvelopeIcon className="h-3.5 w-3.5" />
                  {userEmail}
                </p>
                {memberSince && (
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">
                    {t.profile_page?.memberSince || 'Klient od'} {memberSince}
                  </p>
                )}
              </div>

              <div className="flex gap-2 sm:pb-1">
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="px-3 py-1.5 text-sm font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  {t.profile_page?.editProfile || 'Edytuj profil'}
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  {t.profile_page?.signOut || 'Wyloguj'}
                </button>
              </div>
            </div>

            {/* Editable Profile Form */}
            {editingProfile && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  {t.profile_page?.personalInfo || 'Dane osobowe'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t.profile_page?.fullName || 'Imię i nazwisko'}
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={profileForm.full_name}
                        onChange={e => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-amber-500 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t.profile_page?.phone || 'Telefon'}
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-amber-500 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : saved ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : null}
                    {saved ? (t.profile_page?.saved || 'Zapisano!') : (t.profile_page?.save || 'Zapisz zmiany')}
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {t.profile_page?.cancel || 'Anuluj'}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Info (when not editing) */}
            {!editingProfile && (profile?.full_name || profile?.phone) && (
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                {profile?.phone && (
                  <span className="flex items-center gap-1.5">
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    {profile.phone}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bookings Section */}
        <UserBookings />
      </div>
    </main>
  );
};
