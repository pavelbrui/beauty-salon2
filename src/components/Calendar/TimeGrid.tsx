import React, { useState } from 'react';
import { format, addMinutes, parseISO, isBefore, isAfter } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import { TimeSlot } from '../../types';
import { LoadingSpinner } from '../LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';
import { translations } from '../../i18n/translations';

type TimePeriod = 'morning' | 'afternoon' | 'evening';

const filterSlotsByPeriod = (slots: TimeSlot[], period: TimePeriod): TimeSlot[] => {
  return slots.filter(slot => {
    const hour = parseISO(slot.startTime).getHours();
    switch (period) {
      case 'morning': return hour >= 6 && hour < 12;
      case 'afternoon': return hour >= 12 && hour < 17;
      case 'evening': return hour >= 17 && hour < 22;
      default: return true;
    }
  });
};

interface TimeGridProps {
  timeSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  serviceDuration: number;
  isLoading?: boolean;
}

export const TimeGrid: React.FC<TimeGridProps> = ({
  timeSlots,
  selectedSlot,
  onSlotSelect,
  serviceDuration,
  isLoading = false
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const locale = language === 'pl' ? pl : language === 'ru' ? ru : enUS;
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('morning');
  const filteredSlots = filterSlotsByPeriod(timeSlots, selectedPeriod);

  const formatTime = (time: string) => {
    if (!time || typeof time !== 'string') return '';
    return format(parseISO(time), 'HH:mm', { locale });
  };

  const generateUniqueKey = (slot: TimeSlot) => {
    try {
      const startTime = parseISO(slot.startTime);
      return `${slot.id}-${format(startTime, 'HHmm')}`;
    } catch (error) {
      console.error('Error generating key:', error);
      return `${slot.id}-${Date.now()}-${Math.random()}`;
    }
  };

  const isSlotAvailable = (slot: TimeSlot) => {
    if (!slot || !slot.isAvailable) return false;
    
    const now = new Date();
    const slotStart = parseISO(slot.startTime);
    
    // Don't show past slots
    if (slotStart < now) return false;

    try {
      const startTime = parseISO(slot.startTime);
      const endTime = addMinutes(startTime, serviceDuration + 10); // Add 10 min buffer
    
      // Check for overlapping slots
      return timeSlots.every(otherSlot => {
        if (otherSlot.id === slot.id) return true;
        const otherStart = parseISO(otherSlot.startTime);
        const otherEnd = parseISO(otherSlot.endTime);
        return endTime <= otherStart || startTime >= otherEnd;
      });
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (timeSlots.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        {t.noSlotsAvailable}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center space-x-2">
        <button
          className={`px-4 py-2 rounded-full ${
            selectedPeriod === 'morning' ? 'bg-amber-500 text-white' : 'bg-gray-100'
          }`}
          onClick={() => setSelectedPeriod('morning')}
        >
          {t.booking.morning}
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            selectedPeriod === 'afternoon' ? 'bg-amber-500 text-white' : 'bg-gray-100'
          }`}
          onClick={() => setSelectedPeriod('afternoon')}
        >
          {t.booking.afternoon}
        </button>
        <button
          className={`px-4 py-2 rounded-full ${
            selectedPeriod === 'evening' ? 'bg-amber-500 text-white' : 'bg-gray-100'
          }`}
          onClick={() => setSelectedPeriod('evening')}
        >
          {t.booking.evening}
        </button>
      </div>
      
      <AnimatePresence mode="wait">
      <motion.div 
        key={selectedPeriod}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="grid grid-cols-4 sm:grid-cols-6 gap-3"
      >
      {filteredSlots.map((slot) => {
        const available = slot && slot.isAvailable && isSlotAvailable(slot);
        const isSelected = selectedSlot?.id === slot.id;

        return (
          <button
            key={generateUniqueKey(slot)}
            data-slot-id={slot.id}
            onClick={() => {
              if (available) {
                onSlotSelect(slot);
              }
            }}
            disabled={!available}
            className={`relative p-3 rounded-lg text-center transition-all duration-200 ${
              isSelected 
                ? 'bg-amber-500 text-white ring-2 ring-amber-300 ring-offset-2 scale-105' 
                : !isSelected && available 
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 hover:scale-105 hover:shadow-md' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {formatTime(slot.startTime)}
            {available && (
              <div className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-amber-600'}`}>
                {t.booking.available}
              </div>
            )}
            {isSelected && (
              <motion.div
                layoutId="selected-indicator"
                className="absolute -inset-px rounded-lg border-2 border-amber-500"
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        );
      })}
      </motion.div>
      </AnimatePresence>
    </div>
  );
};