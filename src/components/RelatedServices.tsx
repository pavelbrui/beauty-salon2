import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';
import { translations } from '../i18n/translations';
import { Service } from '../types';
import { getServiceName } from '../utils/serviceTranslation';

interface RelatedServicesProps {
  /** Current service ID to exclude from results */
  currentServiceId?: string;
  /** Services to display */
  services: Service[];
  /** Maximum number of services to show */
  maxServices?: number;
  /** Custom title for the section */
  title?: string;
}

/**
 * Related Services component for internal linking and SEO.
 * 
 * Features:
 * - Displays related services with internal links
 * - Improves site navigation and user experience
 * - Helps distribute link juice across service pages
 * - Increases time on site and reduces bounce rate
 * - SEO-friendly with proper semantic HTML
 * 
 * Usage:
 * <RelatedServices 
 *   currentServiceId={service.id}
 *   services={allServices}
 *   maxServices={4}
 *   title="Powiązane usługi"
 * />
 */
export const RelatedServices: React.FC<RelatedServicesProps> = ({
  currentServiceId,
  services,
  maxServices = 4,
  title,
}) => {
  const { language } = useLanguage();
  const navigate = useLocalizedNavigate();
  const t = translations[language];

  // Filter out current service and limit results
  const relatedServices = services
    .filter(service => service.id !== currentServiceId)
    .slice(0, maxServices);

  if (relatedServices.length === 0) {
    return null;
  }

  const sectionTitle = title || (language === 'pl' ? 'Powiązane usługi' : 'Related Services');

  return (
    <section className="mt-12 pt-12 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{sectionTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedServices.map(service => (
          <article
            key={service.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            {service.imageUrl && (
              <div className="relative h-40 overflow-hidden bg-gray-200">
                <img
                  src={service.imageUrl}
                  alt={`${getServiceName(service, language)} – salon kosmetyczny Białystok`}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  width={300}
                  height={160}
                  decoding="async"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {getServiceName(service, language)}
              </h3>
              <button
                onClick={() => navigate(`/booking/${service.id}`)}
                className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium transition-colors"
                aria-label={`Przejdź do ${getServiceName(service, language)}`}
              >
                {t.bookNow}
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default RelatedServices;
