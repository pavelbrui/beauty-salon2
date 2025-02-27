import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      notes: formData.get('notes') as string,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">{t.booking.contactDetails}</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.booking.name} *
          </label>
          <input
            type="text"
            name="name"
            required
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 transition-shadow duration-200 hover:shadow-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.booking.phone} *
          </label>
          <input
            type="tel"
            name="phone"
            required
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 transition-shadow duration-200 hover:shadow-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.booking.email} *
          </label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t.booking.notes}
          </label>
          <textarea
            name="notes"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            {t.booking.cancel}
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {t.booking.confirm}
          </button>
        </div>
      </form>
    </motion.div>
  );
};