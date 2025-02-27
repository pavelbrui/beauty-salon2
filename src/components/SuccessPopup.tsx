import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import { Service, TimeSlot } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

interface SuccessPopupProps {
  service: Service;
  timeSlot: TimeSlot;
  onClose: () => void;
}

export const SuccessPopup: React.FC<SuccessPopupProps> = ({
  service,
  timeSlot,
  onClose,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const locale = language === 'pl' ? pl : language === 'ru' ? ru : enUS;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.3 } }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t.booking.success.title}
          </h3>
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium">{service.name}</p>
            <p className="mt-1">
              {format(parseISO(timeSlot.startTime), 'EEEE, d MMMM', { locale })}
            </p>
            <p>
              {format(parseISO(timeSlot.startTime), 'HH:mm')}
            </p>
          </div>
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 transform hover:scale-105 transition-all duration-200"
            >
              {t.booking.success.close}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};