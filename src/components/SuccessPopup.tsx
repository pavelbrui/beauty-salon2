import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import { Service, TimeSlot } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { getServiceName } from '../utils/serviceTranslation';
import { supabase } from '../lib/supabase';

interface SuccessPopupProps {
  service: Service;
  timeSlot: TimeSlot;
  bookingId?: string | null;
  onClose: () => void;
}

export const SuccessPopup: React.FC<SuccessPopupProps> = ({
  service,
  timeSlot,
  bookingId,
  onClose,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const locale = language === 'pl' ? pl : language === 'ru' ? ru : enUS;

  const [status, setStatus] = React.useState<'pending' | 'confirmed' | 'cancelled'>('pending');
  const [isChecking, setIsChecking] = React.useState(!!bookingId);

  React.useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;
    let timer: number | null = null;
    const startedAt = Date.now();
    const maxWaitMs = 10_000;
    const intervalMs = 1_000;

    const check = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('status')
          .eq('id', bookingId)
          .single();

        if (!isMounted) return;
        if (!error && data?.status) {
          setStatus(data.status);
          if (data.status === 'confirmed' || data.status === 'cancelled') {
            setIsChecking(false);
            return;
          }
        }
      } catch {
        // Best-effort polling; ignore transient failures.
      }

      if (!isMounted) return;
      if (Date.now() - startedAt >= maxWaitMs) {
        setIsChecking(false);
        return;
      }

      timer = window.setTimeout(check, intervalMs);
    };

    check();

    return () => {
      isMounted = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [bookingId]);

  const ui = (() => {
    if (status === 'confirmed') {
      return {
        title: t.booking.success.confirmedTitle || t.booking.success.title,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        ring: 'border-green-200',
        showSpinner: false,
        message: t.booking.success.confirmedBody,
      };
    }
    if (status === 'cancelled') {
      return {
        title: t.booking.success.cancelledTitle,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        ring: 'border-red-200',
        showSpinner: false,
        message: t.booking.success.cancelledBody,
      };
    }
    return {
      title: t.booking.success.pendingTitle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
      ring: 'border-amber-200',
      showSpinner: isChecking,
      message: isChecking ? t.booking.success.pendingBodyChecking : t.booking.success.pendingBody,
    };
  })();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.3 } }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${ui.iconBg} mb-4`}>
            {ui.showSpinner ? (
              <span className={`animate-spin h-6 w-6 border-2 border-t-transparent rounded-full ${ui.iconColor}`} />
            ) : (
              <svg
                className={`h-6 w-6 ${ui.iconColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {status === 'confirmed' ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                )}
              </svg>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {ui.title}
          </h3>
          {ui.message && (
            <div className={`text-sm text-gray-600 bg-gray-50 border ${ui.ring} rounded-lg p-3 text-left`}>
              {ui.message}
            </div>
          )}
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium">{getServiceName(service, language)}</p>
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