import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import { useLanguage } from '../hooks/useLanguage';
import { TimeSlot } from '../types';

interface TimeSlotPickerProps {
  date: Date;
  timeSlots: TimeSlot[];
  onSelectSlot: (slot: TimeSlot) => void;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  date,
  timeSlots,
  onSelectSlot,
}) => {
  const { language } = useLanguage();
  const locale = language === 'pl' ? pl : language === 'ru' ? ru : enUS;

  const formatTime = (date: string) => {
    return format(new Date(date), 'HH:mm', { locale });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        {format(date, 'EEEE, d MMMM', { locale })}
      </h3>

      <div className="grid grid-cols-3 gap-2">
        {timeSlots.map((slot) => (
          <motion.button
            key={slot.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectSlot(slot)}
            className={`p-3 rounded-lg text-center transition-colors ${
              slot.isAvailable
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!slot.isAvailable}
          >
            {formatTime(slot.startTime)}
          </motion.button>
        ))}
      </div>
    </div>
  );
};