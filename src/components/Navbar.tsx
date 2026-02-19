import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { AuthModal } from './AuthModal';

export const Navbar: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  const isHome = location.pathname === '/';

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
  const bgClass = showSolid ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-black/20 backdrop-blur-sm';
  const textClass = showSolid ? 'text-gray-800' : 'text-white';
  const activeTextClass = showSolid ? 'text-amber-600' : 'text-amber-400';
  const hoverTextClass = showSolid ? 'hover:text-amber-600' : 'hover:text-amber-200';

  const isActive = (path: string) => {
    return location.pathname === path ||
           (path.startsWith('/#') && location.hash === path.substring(1)) ||
           (path === '/services' && location.pathname.startsWith('/services'));
  };

  const navItems = [
    { path: '/services', label: t.services },
    { path: '/appointments', label: t.appointments },
    { path: '/stylists', label: t.stylists },
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
      className={`fixed w-full z-50 transition-colors duration-300 ${bgClass}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center h-14">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`sm:hidden p-2 rounded-lg ${textClass} hover:bg-black/10 mr-4`}
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
            <Link to="/" className="flex items-center">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src="https://d375139ucebi94.cloudfront.net/region2/pl/162206/logo/163448f26b6c40adb662c97da37033-katarzyna-brui-logo-20152422ca364bf1a5efce379aec29-booksy.jpeg"
                alt="Katarzyna Brui"
                className="h-12 w-16 rounded-full object-cover gray-300/50 shadow-sm"
              />
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="ml-2 text-lg font-bold bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300 bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer"
              >
              </motion.span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`relative inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors
                    ${isActive(path) ? activeTextClass : `${textClass} ${hoverTextClass}`}`}
                >
                  {label}
                  {isActive(path) && (
                    <motion.div
                      layoutId="navbar-underline"
                      className={`absolute bottom-0 left-0 right-0 h-0.5 ${showSolid ? 'bg-amber-600' : 'bg-amber-400'}`}
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className={`${showSolid ? 'bg-gray-100' : 'bg-black/30'} rounded-full p-0.5 flex space-x-0.5`}>
              {(['pl', 'en', 'ru'] as const).map((lang) => (
                <motion.button
                  key={lang}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLanguage(lang)}
                  aria-label={langLabels[lang]}
                  className={`w-8 h-8 rounded-full text-xs font-medium uppercase flex items-center justify-center transition-colors ${
                    language === lang
                      ? 'bg-amber-500 text-white'
                      : showSolid ? 'text-gray-600 hover:bg-gray-200' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {lang}
                </motion.button>
              ))}
            </div>

            {user ? (
              <button
                onClick={() => navigate('/profile')}
                className={`p-2 rounded-full transition-colors ${showSolid ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-white/10 text-white'}`}
                aria-label="Profile"
              >
                <UserIcon className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="hidden sm:block bg-amber-500 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-amber-600 transition-colors"
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
              <div className={`px-2 pt-2 pb-3 space-y-1 ${showSolid ? 'bg-gray-50' : 'bg-black/30 backdrop-blur-sm'} rounded-lg mt-2`}>
                {navItems.map(({ path, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive(path)
                        ? 'bg-amber-500 text-white'
                        : `${textClass} ${showSolid ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                {!user && (
                  <button
                    onClick={() => { setIsOpen(false); setShowAuthModal(true); }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${textClass} ${showSolid ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                  >
                    {t.auth.signIn}
                  </button>
                )}
                {user && (
                  <Link
                    to="/profile"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${textClass} ${showSolid ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                  >
                    {language === 'pl' ? 'Profil' : language === 'ru' ? 'Профиль' : 'Profile'}
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
        navigate('/profile');
      }}
    />
    </>
  );
};
