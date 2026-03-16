import React, { AnchorHTMLAttributes } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';

interface SEOLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Target route path (without language prefix) */
  to: string;
  /** Link text content */
  children: React.ReactNode;
  /** Optional CSS classes */
  className?: string;
  /** Whether to open in new tab */
  external?: boolean;
  /** Optional title for accessibility */
  title?: string;
}

/**
 * SEO-optimized internal link component.
 * Automatically handles language prefixes and provides proper link structure.
 * 
 * Features:
 * - Automatic language prefix handling
 * - Proper rel attributes for external links
 * - Accessibility support (title, aria-label)
 * - Consistent link styling
 * 
 * Usage:
 * <SEOLink to="/services/makijaz-permanentny-bialystok">
 *   Makijaż permanentny
 * </SEOLink>
 */
export const SEOLink: React.FC<SEOLinkProps> = ({
  to,
  children,
  className = '',
  external = false,
  title,
  ...props
}) => {
  const { language } = useLanguage();
  const location = useLocation();

  // Build localized path
  const getLocalizedPath = (path: string): string => {
    if (language === 'pl') return path;
    return `/${language}${path}`;
  };

  const localizedPath = getLocalizedPath(to);

  // Determine if link is to current page
  const isCurrent = location.pathname === localizedPath;

  if (external) {
    return (
      <a
        href={to}
        className={className}
        rel="noopener noreferrer"
        title={title}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <RouterLink
      to={localizedPath}
      className={className}
      title={title || (typeof children === 'string' ? children : undefined)}
      aria-current={isCurrent ? 'page' : undefined}
      {...props}
    >
      {children}
    </RouterLink>
  );
};

export default SEOLink;
