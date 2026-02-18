import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';
import { motion } from 'framer-motion';

export const Navbar: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

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

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed w-full z-50 bg-black/20 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center h-14">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="sm:hidden p-2 rounded-lg text-white hover:bg-white/10 mr-4"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
          <div className="flex">
            <Link to="/" className="flex items-center">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300 bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer"
              >
                KB Beauty
              </motion.span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`relative inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors
                    ${isActive(path) ? 'text-amber-400' : 'text-white hover:text-amber-200'}`}
                >
                  {label}
                  {isActive(path) && (
                    <motion.div
                      layoutId="navbar-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="ml-auto flex items-center">
            <div className="bg-black/30 rounded-full p-0.5 flex space-x-0.5">
              {['pl', 'en', 'ru'].map((lang) => (
                <motion.button
                  key={lang}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLanguage(lang as 'pl' | 'en' | 'ru')}
                  className={`w-6 h-6 rounded-full text-xs font-medium uppercase flex items-center justify-center transition-colors ${
                    language === lang
                      ? 'bg-amber-500 text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {lang}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sm:hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black/30 backdrop-blur-sm rounded-lg mt-2">
              {navItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(path)
                      ? 'bg-amber-500 text-white'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};