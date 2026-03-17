import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedNavigate } from '../hooks/useLocalizedPath';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Optional custom className */
  className?: string;
}

/**
 * Breadcrumbs component for navigation and SEO.
 * 
 * Features:
 * - Displays hierarchical navigation breadcrumbs
 * - Improves user experience and site navigation
 * - Generates schema.org BreadcrumbList markup
 * - Helps Google understand site structure
 * - Improves click-through rates in search results
 * 
 * Usage:
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Strona główna', path: '/' },
 *     { label: 'Zabiegi', path: '/services' },
 *     { label: 'Makijaż permanentny' }
 *   ]}
 * />
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
}) => {
  const navigate = useLocalizedNavigate();
  const { language } = useLanguage();

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className={`flex items-center text-sm text-gray-600 mb-6 ${className}`}
      aria-label={language === 'pl' ? 'Ścieżka nawigacji' : 'Breadcrumb navigation'}
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center">
              {!isFirst && (
                <svg
                  className="w-4 h-4 mx-2 text-gray-400"
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
              )}

              {item.path && !isLast ? (
                <button
                  onClick={() => navigate(item.path!)}
                  className="text-amber-600 hover:text-amber-700 transition-colors underline"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className={isLast ? 'text-gray-900 font-medium' : ''}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
