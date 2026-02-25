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

  const formatPrice = (price: number) => `${(price / 100).toFixed(0)} PLN`;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins > 0 ? `${mins}min` : ''}` : `${mins}min`;
  };

  return (
    <div className="group bg-white border border-gray-100 hover:border-gray-200 transition-all duration-500 overflow-hidden">
      {service.imageUrl && (
        <div className="relative h-56 overflow-hidden">
          <img
            src={service.imageUrl}
            alt={`${getServiceName(service, language)} – studio urody Anna Nowak Białystok`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[800ms]"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-serif font-bold text-gray-900 leading-tight">{getServiceName(service, language)}</h3>
          <span className="text-lg font-serif font-bold text-rose-500 whitespace-nowrap">
            {formatPrice(service.price)}
          </span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {formatDuration(service.duration)}
          </span>
        </div>
        {service.description && (
          <p className="text-gray-400 text-sm leading-relaxed mb-5 line-clamp-2">{getServiceDescription(service, language)}</p>
        )}
        <button
          onClick={() => navigate(`/booking/${service.id}`)}
          className="w-full text-[12px] uppercase tracking-[0.15em] font-semibold py-3.5 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300"
        >
          {t.bookNow}
        </button>
      </div>
    </div>
  );
};
