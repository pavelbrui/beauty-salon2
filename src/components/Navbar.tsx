import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { AuthModal } from './AuthModal';
import { useAdmin } from '../hooks/useAdmin';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { LocalizedLink } from './LocalizedLink';
import { stripLangPrefix, localizedPath, SupportedLanguage } from '../hooks/useLocalizedPath';

export const Navbar: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const { isAdmin } = useAdmin();

  const barePath = stripLangPrefix(location.pathname);
  const isHome = barePath === '/' || barePath === '';

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => { setIsOpen(false); }, [location.pathname]);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const showSolid = scrolled || !isHome;
  const bgClass = showSolid
    ? 'bg-white/80 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.04)]'
    : 'bg-transparent';
  const textClass = showSolid ? 'text-gray-900' : 'text-white';
  const activeTextClass = showSolid ? 'text-rose-600' : 'text-white';
  const hoverTextClass = showSolid ? 'hover:text-rose-500' : 'hover:text-white/70';
  const mutedClass = showSolid ? 'text-gray-500' : 'text-white/60';

  const isActive = (path: string) => {
    return barePath === path ||
           (path.startsWith('/#') && location.hash === path.substring(1)) ||
           (path === '/services' && barePath.startsWith('/services'));
  };

  const switchLanguage = (newLang: SupportedLanguage) => {
    const currentBarePath = stripLangPrefix(location.pathname);
    const searchAndHash = location.search + location.hash;
    setLanguage(newLang);
    navigate(localizedPath(currentBarePath || '/', newLang) + searchAndHash);
  };

  const navItems = [
    { path: '/services', label: t.services },
    { path: '/appointments', label: t.appointments },
    { path: '/stylists', label: t.stylists },
    { path: '/training', label: t.training },
    { path: '/blog', label: (t as Record<string, unknown>).blog as string || 'Blog' },
    { path: '/gallery', label: t.gallery }
  ];

  const langLabels: Record<string, string> = {
    pl: 'Polski', en: 'English', ru: 'Русский'
  };

  return (
    <>
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed w-full z-50 transition-all duration-700 ${bgClass}`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-20">
          {/* Left: hamburger on mobile */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 -ml-2 ${textClass}`}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>

          {/* Left nav items (desktop) */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.slice(0, 3).map(({ path, label }) => (
              <LocalizedLink
                key={path}
                to={path}
                className={`text-[13px] uppercase tracking-[0.15em] font-medium transition-colors duration-300
                  ${isActive(path) ? activeTextClass : `${mutedClass} ${hoverTextClass}`}`}
              >
                {label}
              </LocalizedLink>
            ))}
          </div>

          {/* Center: brand */}
          <LocalizedLink to="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className={`text-2xl font-serif font-bold tracking-wider ${textClass} transition-colors duration-700`}>
              ANNA NOWAK
            </span>
            <span className={`text-[10px] uppercase tracking-[0.4em] ${mutedClass} transition-colors duration-700 mt-0.5`}>
              beauty studio
            </span>
          </LocalizedLink>

          {/* Right nav items (desktop) */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.slice(3).map(({ path, label }) => (
              <LocalizedLink
                key={path}
                to={path}
                className={`text-[13px] uppercase tracking-[0.15em] font-medium transition-colors duration-300
                  ${isActive(path) ? activeTextClass : `${mutedClass} ${hoverTextClass}`}`}
              >
                {label}
              </LocalizedLink>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language pills */}
            <div className="hidden sm:flex items-center gap-1 mr-2">
              {(['pl', 'en', 'ru'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => switchLanguage(lang)}
                  aria-label={langLabels[lang]}
                  className={`text-[11px] uppercase tracking-wider px-2 py-1 rounded transition-all duration-300 ${
                    language === lang
                      ? `font-bold ${showSolid ? 'text-rose-600' : 'text-white'}`
                      : `${mutedClass} ${hoverTextClass}`
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className={`p-2 rounded-full transition-colors ${showSolid ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-white/10 text-white/60'}`}
                aria-label="Admin"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </Link>
            )}

            {user ? (
              <button
                onClick={() => navigate(localizedPath('/profile', language))}
                className={`p-2 rounded-full transition-colors ${showSolid ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-white/10 text-white/60'}`}
                aria-label="Profile"
              >
                <UserIcon className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className={`hidden sm:block text-[13px] uppercase tracking-[0.1em] font-medium px-5 py-2.5 rounded-none border transition-all duration-300 ${
                  showSolid
                    ? 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                    : 'border-white text-white hover:bg-white hover:text-gray-900'
                }`}
              >
                {t.auth.signIn}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden"
          >
            <div className={`px-6 pt-4 pb-8 space-y-1 ${showSolid ? 'bg-white' : 'bg-gray-900/95 backdrop-blur-xl'}`}>
              {navItems.map(({ path, label }) => (
                <LocalizedLink
                  key={path}
                  to={path}
                  className={`block py-3 text-[13px] uppercase tracking-[0.15em] font-medium border-b transition-colors ${
                    isActive(path)
                      ? `${showSolid ? 'text-rose-600 border-rose-200' : 'text-white border-white/20'}`
                      : `${showSolid ? 'text-gray-400 border-gray-100 hover:text-gray-900' : 'text-white/40 border-white/5 hover:text-white'}`
                  }`}
                >
                  {label}
                </LocalizedLink>
              ))}
              <div className="pt-4 flex items-center gap-4">
                {(['pl', 'en', 'ru'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => switchLanguage(lang)}
                    className={`text-[11px] uppercase tracking-wider ${
                      language === lang
                        ? (showSolid ? 'text-rose-600 font-bold' : 'text-white font-bold')
                        : (showSolid ? 'text-gray-400' : 'text-white/40')
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              {!user && (
                <button
                  onClick={() => { setIsOpen(false); setShowAuthModal(true); }}
                  className={`mt-4 w-full py-3 text-[13px] uppercase tracking-[0.15em] font-medium border ${
                    showSolid ? 'border-gray-900 text-gray-900' : 'border-white text-white'
                  }`}
                >
                  {t.auth.signIn}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>

    <AuthModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      mode="signin"
      onSuccess={() => {
        setShowAuthModal(false);
        navigate(localizedPath('/profile', language));
      }}
    />
    </>
  );
};
