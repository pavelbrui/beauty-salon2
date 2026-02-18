import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { signIn, signUp } from '../lib/auth';
import { saveUserData } from '../utils/cookies';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  onSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const passwordLabel = language === 'pl' ? 'Hasło' : language === 'ru' ? 'Пароль' : 'Password';

  const errorMessages: Record<string, Record<string, string>> = {
    pl: {
      'User already registered': 'Ten email jest już zarejestrowany. Spróbuj się zalogować.',
      'Invalid login credentials': 'Nieprawidłowy email lub hasło.',
    },
    en: {
      'User already registered': 'This email is already registered. Try signing in.',
      'Invalid login credentials': 'Invalid email or password.',
    },
    ru: {
      'User already registered': 'Этот email уже зарегистрирован. Попробуйте войти.',
      'Invalid login credentials': 'Неверный email или пароль.',
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await (mode === 'signin'
      ? signIn(email, password)
      : signUp(email, password));

    setLoading(false);

    if (authError) {
      const langErrors = errorMessages[language] || errorMessages.en;
      const matchedKey = Object.keys(langErrors).find(key => authError.message.includes(key));
      setError(matchedKey ? langErrors[matchedKey] : authError.message);
    } else {
      saveUserData({ email });
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl p-6 max-w-md w-full relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold mb-1">
          {mode === 'signin' ? t.auth.signIn : t.auth.signUp}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {mode === 'signin' ? t.auth.signInDescription : t.auth.signUpDescription}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{passwordLabel}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:ring-amber-500 focus:outline-none"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-white py-2.5 px-4 rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              mode === 'signin' ? t.auth.signIn : t.auth.signUp
            )}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              {mode === 'signin' ? t.auth.noAccount : t.auth.hasAccount}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
