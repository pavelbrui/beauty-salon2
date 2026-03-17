import React from 'react';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';
import { Service } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { getServiceName, getServiceDescription } from '../utils/serviceTranslation';

interface ServiceCardOptimizedProps {
  service: Service;
  imgLoading?: 'eager' | 'lazy';
  /** Optional image width for responsive images */
  imgWidth?: number;
  /** Optional image height for responsive images */
  imgHeight?: number;
  /** Optional custom alt text */
  customAlt?: string;
}

/**
 * Optimized Service Card component with enhanced SEO and performance.
 * 
 * Features:
 * - Descriptive alt text for images
 * - Lazy loading support
 * - Responsive image dimensions
 * - Proper semantic HTML
 * - Accessibility improvements
 * 
 * Improvements over original:
 * - Better alt text that includes location and service type
 * - Optional image width/height for better layout shift prevention
 * - Custom alt text support
 * - Improved accessibility with proper heading hierarchy
 */
export const ServiceCardOptimized: React.FC<ServiceCardOptimizedProps> = ({
  service,
  imgLoading = 'lazy',
  imgWidth = 400,
  imgHeight = 192,
  customAlt,
}) => {
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

  // Generate SEO-friendly alt text
  const generateAltText = (): string => {
    if (customAlt) return customAlt;
    const serviceName = getServiceName(service, language);
    return `${serviceName} – salon kosmetyczny Białystok – efekt zabiegu`;
  };

  const altText = generateAltText();

  return (
    <article className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
      {service.imageUrl && (
        <div className="relative h-48 overflow-hidden bg-gray-200">
          <img
            src={service.imageUrl}
            alt={altText}
            loading={imgLoading}
            className="absolute inset-0 w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
            width={imgWidth}
            height={imgHeight}
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}
      <div className="p-8">
        <h3 className="text-xl font-semibold text-gray-900">
          {getServiceName(service, language)}
        </h3>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-2xl font-bold text-amber-600" aria-label={`Cena: ${formatPrice(service.price)}`}>
            {formatPrice(service.price)}
          </span>
          <span className="text-sm text-gray-500" aria-label={`Czas zabiegu: ${formatDuration(service.duration)}`}>
            {formatDuration(service.duration)}
          </span>
        </div>
        {service.description && (
          <p className="mt-4 text-gray-600">
            {getServiceDescription(service, language)}
          </p>
        )}
        <button
          onClick={() => navigate(`/booking/${service.id}`)}
          className="mt-6 w-full bg-amber-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-amber-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          aria-label={`Zarezerwuj ${getServiceName(service, language)}`}
        >
          {t.bookNow}
        </button>
      </div>
    </article>
  );
};

export default ServiceCardOptimized;
