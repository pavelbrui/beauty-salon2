import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { getUserData } from '../utils/cookies';
import { loadProfile } from '../lib/profile';

import { supabase } from '../lib/supabase';

interface BookingFormProps {
  onSubmit: (data: { name: string; phone: string; email: string; notes?: string }) => void;
  onCancel: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onSubmit, onCancel }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const userData = getUserData();

  const [formData, setFormData] = React.useState({
    name: userData.name || '', phone: userData.phone || '', email: userData.email || '', notes: ''
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); onSubmit(formData); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClass = "block w-full border-0 border-b-2 border-gray-200 px-0 py-3 text-gray-900 placeholder-gray-300 focus:border-rose-500 focus:ring-0 transition-colors bg-transparent text-sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white p-10 max-w-lg w-full mx-auto shadow-2xl"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-serif font-bold text-gray-900">{t.booking.contactDetails}</h3>
        <button onClick={onCancel} className="text-gray-300 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] font-semibold text-gray-500 mb-2">{t.booking.name} *</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] font-semibold text-gray-500 mb-2">{t.booking.phone} *</label>
          <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] font-semibold text-gray-500 mb-2">{t.booking.email} *</label>
          <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-[0.1em] font-semibold text-gray-500 mb-2">{t.booking.notes}</label>
          <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className={inputClass} />
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onCancel} className="px-5 py-3 text-sm text-gray-400 hover:text-gray-700 transition-colors">
            {t.booking.cancel}
          </button>
          <button type="submit" className="px-8 py-3.5 bg-gray-900 text-white text-[12px] uppercase tracking-[0.15em] font-semibold hover:bg-rose-600 transition-all duration-500">
            {t.booking.confirm}
          </button>
        </div>
      </form>
    </motion.div>
  );
};
