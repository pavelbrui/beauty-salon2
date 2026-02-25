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
  const bgClass = showSolid ? 'bg-dark/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-brand/10' : 'bg-transparent';
  const textClass = showSolid ? 'text-cream' : 'text-cream';
  const activeTextClass = showSolid ? 'text-brand' : 'text-brand-300';
  const hoverTextClass = showSolid ? 'hover:text-brand' : 'hover:text-brand-200';

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
      className={`fixed w-full z-50 transition-all duration-300 ${bgClass}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center h-16">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`sm:hidden p-2 rounded-lg ${textClass} hover:bg-white/10 mr-4`}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
          <div className="flex">
            <LocalizedLink to="/" className="flex items-center">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src="https://d375139ucebi94.cloudfront.net/region2/pl/162206/logo/163448f26b6c40adb662c97da37033-katarzyna-brui-logo-20152422ca364bf1a5efce379aec29-booksy.jpeg"
                alt="Katarzyna Brui"
                className="h-11 w-14 rounded-full object-cover ring-2 ring-brand/30 shadow-lg"
              />
            </LocalizedLink>
            <div className="hidden sm:ml-8 sm:flex sm:gap-1">
              {navItems.map(({ path, label }) => (
                <LocalizedLink
                  key={path}
                  to={path}
                  className={`relative inline-flex items-center px-3 py-2 text-sm font-medium transition-colors
                    ${isActive(path) ? activeTextClass : `${textClass} ${hoverTextClass}`}`}
                >
                  {label}
                  {isActive(path) && (
                    <motion.div
                      layoutId="navbar-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"
                    />
                  )}
                </LocalizedLink>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className={`${showSolid ? 'bg-dark-50' : 'bg-white/10'} rounded-full p-0.5 flex gap-0.5`}>
              {(['pl', 'en', 'ru'] as const).map((lang) => (
                <motion.button
                  key={lang}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => switchLanguage(lang)}
                  aria-label={langLabels[lang]}
                  className={`w-8 h-8 rounded-full text-xs font-medium uppercase flex items-center justify-center transition-colors ${
                    language === lang
                      ? 'bg-brand text-dark'
                      : showSolid ? 'text-cream-300 hover:bg-dark-100 hover:text-cream' : 'text-cream/80 hover:bg-white/10 hover:text-cream'
                  }`}
                >
                  {lang}
                </motion.button>
              ))}
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className={`p-2 rounded-full transition-colors ${showSolid ? 'hover:bg-dark-50 text-cream-300' : 'hover:bg-white/10 text-cream'}`}
                aria-label="Admin"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </Link>
            )}

            {user ? (
              <button
                onClick={() => navigate(localizedPath('/profile', language))}
                className={`p-2 rounded-full transition-colors ${showSolid ? 'hover:bg-dark-50 text-cream-300' : 'hover:bg-white/10 text-cream'}`}
                aria-label="Profile"
              >
                <UserIcon className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="hidden sm:block bg-brand text-dark px-5 py-2 rounded-full text-sm font-semibold hover:bg-brand-400 transition-colors"
              >
                {t.auth.signIn}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="sm:hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 bg-dark-50/95 backdrop-blur-md rounded-xl mt-2 border border-brand/10">
                {navItems.map(({ path, label }) => (
                  <LocalizedLink
                    key={path}
                    to={path}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive(path)
                        ? 'bg-brand text-dark'
                        : `${textClass} hover:bg-white/10`
                    }`}
                  >
                    {label}
                  </LocalizedLink>
                ))}
                {!user && (
                  <button
                    onClick={() => { setIsOpen(false); setShowAuthModal(true); }}
                    className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-cream hover:bg-white/10"
                  >
                    {t.auth.signIn}
                  </button>
                )}
                {user && (
                  <LocalizedLink
                    to="/profile"
                    className="block px-4 py-3 rounded-lg text-base font-medium text-cream hover:bg-white/10"
                  >
                    {language === 'pl' ? 'Profil' : language === 'ru' ? 'Профиль' : 'Profile'}
                  </LocalizedLink>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium text-cream hover:bg-white/10"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                    {language === 'pl' ? 'Panel admina' : language === 'ru' ? 'Админ панель' : 'Admin panel'}
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
