import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Service } from '../types';
import { AdvancedBookingCalendar } from './Calendar/AdvancedBookingCalendar';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';
import { useLanguage } from '../hooks/useLanguage';
import { getServiceName } from '../utils/serviceTranslation';

interface BookingModalProps {
  service: Service;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ 
  service, 
  onClose 
}) => {
  const navigate = useLocalizedNavigate();
  const { language } = useLanguage();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{getServiceName(service, language)}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <AdvancedBookingCalendar
            service={service}
            onSlotSelect={() => {
              navigate(`/booking/${service.id}`);
              onClose();
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};