import { useCallback } from 'react';
import { useNavigate, NavigateOptions } from 'react-router-dom';
import { useLanguage } from './useLanguage';

export type SupportedLanguage = 'pl' | 'en' | 'ru';

const LANG_PREFIXES: readonly string[] = ['en', 'ru'];

/** Prepend language prefix to a path. Polish (default) gets no prefix. */
export const localizedPath = (path: string, language: SupportedLanguage): string => {
  if (language === 'pl') return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${language}${normalized}`;
};

/** Strip /en or /ru prefix from pathname, returning the bare path. */
export const stripLangPrefix = (pathname: string): string => {
  const match = pathname.match(/^\/(en|ru)(\/.*)?$/);
  if (match) return match[2] || '/';
  return pathname;
};

/** Detect language from the first URL segment. */
export const detectLangFromPath = (pathname: string): SupportedLanguage => {
  const firstSegment = pathname.split('/')[1];
  if (LANG_PREFIXES.includes(firstSegment)) return firstSegment as SupportedLanguage;
  return 'pl';
};

/** Hook: return current language prefix string ('', '/en', '/ru'). */
export const useLanguagePrefix = (): string => {
  const { language } = useLanguage();
  return language === 'pl' ? '' : `/${language}`;
};

/** Hook: navigate with automatic language prefix. Numeric args (e.g. -1) pass through. */
export const useLocalizedNavigate = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        navigate(to);
        return;
      }
      navigate(localizedPath(to, language), options);
    },
    [navigate, language]
  );
};
