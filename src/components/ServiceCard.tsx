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
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl overflow-hidden transition-all duration-500 border border-rose-100/50 group">
      {service.imageUrl && (
        <div className="relative h-52 overflow-hidden">
          <img
            src={service.imageUrl}
            alt={`${getServiceName(service, language)} – studio urody Anna Nowak Białystok`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-rose-950/40 to-transparent" />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-sm font-semibold text-rose-600">{formatPrice(service.price)}</span>
          </div>
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-serif font-semibold text-gray-900">{getServiceName(service, language)}</h3>
        <div className="mt-2 flex justify-between items-center">
          {!service.imageUrl && (
            <span className="text-2xl font-bold text-rose-600">
              {formatPrice(service.price)}
            </span>
          )}
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {formatDuration(service.duration)}
          </span>
        </div>
        {service.description && (
          <p className="mt-3 text-gray-500 text-sm leading-relaxed">{getServiceDescription(service, language)}</p>
        )}
        <button
          onClick={() => navigate(`/booking/${service.id}`)}
          className="mt-5 w-full bg-rose-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-rose-600 transition-all hover:shadow-lg hover:shadow-rose-500/20"
        >
          {t.bookNow}
        </button>
      </div>
    </div>
  );
};
