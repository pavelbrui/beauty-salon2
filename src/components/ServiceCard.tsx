import React from 'react';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';
import { Service } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { getServiceName, getServiceDescription } from '../utils/serviceTranslation';

interface ServiceCardProps {
  service: Service;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const navigate = useLocalizedNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const formatPrice = (price: number) => {
    return `${(price / 100).toFixed(0)} PLN`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 
      ? `${hours}h ${mins > 0 ? `${mins}min` : ''}`
      : `${mins}min`;
  };

  return (
    <div className="bg-dark-50 border border-brand/20 overflow-hidden transform hover:scale-[1.02] hover:border-brand/40 transition-all duration-300">
      {service.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={service.imageUrl}
            alt={`${getServiceName(service, language)} – salon kosmetyczny Białystok`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent" />
        </div>
      )}
      <div className="p-8">
        <h3 className="font-display text-xl font-semibold text-cream">{getServiceName(service, language)}</h3>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-2xl font-bold text-brand">
            {formatPrice(service.price)}
          </span>
          <span className="text-sm text-cream-300">
            {formatDuration(service.duration)}
          </span>
        </div>
        {service.description && (
          <p className="mt-4 text-cream-300">{getServiceDescription(service, language)}</p>
        )}
        <button
          onClick={() => navigate(`/booking/${service.id}`)}
          className="mt-6 w-full bg-brand text-dark py-3 px-6 font-semibold hover:bg-brand-400 transition-colors"
        >
          {t.bookNow}
        </button>
      </div>
    </div>
  );
};