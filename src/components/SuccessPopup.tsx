import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import { Service, TimeSlot } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { getServiceName } from '../utils/serviceTranslation';

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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-rose-100/50">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-50 mb-5">
            <svg
              className="h-7 w-7 text-emerald-500"
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
          <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
            {t.booking.success.title}
          </h3>
          <div className="mt-4 text-sm text-gray-500">
            <p className="font-medium text-gray-700">{getServiceName(service, language)}</p>
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
              className="w-full bg-rose-500 text-white px-4 py-3 rounded-xl hover:bg-rose-600 transition-all font-medium hover:shadow-lg hover:shadow-rose-500/20"
            >
              {t.booking.success.close}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};