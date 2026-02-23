import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { getUserData } from '../utils/cookies';
import { loadProfile } from '../lib/profile';

import { supabase } from '../lib/supabase';

interface BookingFormProps {
  onSubmit: (data: {
    name: string;
    phone: string;
    email: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onSubmit, onCancel }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const userData = getUserData();

  const [formData, setFormData] = React.useState({
    name: userData.name || '',
    phone: userData.phone || '',
    email: userData.email || '',
    notes: ''
  });

  React.useEffect(() => {
    loadProfile().then(profile => {
      if (profile) {
        setFormData(prev => ({
          ...prev,
          name: prev.name || profile.full_name || '',
          phone: prev.phone || profile.phone || '',
          email: prev.email || profile.email || ''
        }));
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email && !formData.email) {
        setFormData(prev => ({ ...prev, email: session.user.email || '' }));
      }
    });
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-auto border border-rose-100/50"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-serif font-semibold text-gray-900">{t.booking.contactDetails}</h3>
        <button
          onClick={onCancel}
          className="text-gray-300 hover:text-gray-500 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            {t.booking.name} *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-rose-400 focus:ring-rose-400 transition-all bg-gray-50/50 hover:border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            {t.booking.phone} *
          </label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-rose-400 focus:ring-rose-400 transition-all bg-gray-50/50 hover:border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            {t.booking.email} *
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-rose-400 focus:ring-rose-400 transition-all bg-gray-50/50 hover:border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            {t.booking.notes}
          </label>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-rose-400 focus:ring-rose-400 transition-all bg-gray-50/50 hover:border-gray-300"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {t.booking.cancel}
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all font-medium hover:shadow-lg hover:shadow-rose-500/20"
          >
            {t.booking.confirm}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
