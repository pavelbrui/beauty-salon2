import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Service } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

interface ServiceCardProps {
  service: Service;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const formatPrice = (price: number) => {
    return `${(price / 100).toFixed(2)} zł`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 
      ? `${hours}h ${mins > 0 ? `${mins}min` : ''}`
      : `${mins}min`;
  };

  // Translate category and service name based on language
  const translatedCategory = t.categories[service.category as keyof typeof t.categories] || service.category;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
      {service.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transform hover:scale-110 transition-transform duration-700"
            style={{ backgroundImage: `url(${service.imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}
      <div className="p-8">
        <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-2xl font-bold text-amber-600">
            {formatPrice(service.price)}
          </span>
          <span className="text-sm text-gray-500">
            {formatDuration(service.duration)}
          </span>
        </div>
        {service.description && (
          <p className="mt-4 text-gray-600">{service.description}</p>
        )}
        <button
          onClick={() => navigate(`/appointments?service=${service.id}`)}
          className="mt-6 w-full bg-amber-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-amber-600 transition-colors shadow-sm"
        >
          {t.bookNow}
        </button>
      </div>
    </div>
  );
};