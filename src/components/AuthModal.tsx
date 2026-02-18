import React, { useState } from 'react';
import { signIn, signUp } from '../lib/auth';
import { saveUserData } from '../utils/cookies';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { error: authError } = await (mode === 'signin'
      ? signIn(email, password)
      : signUp(email, password));

    if (authError) {
      if (authError.message.includes('User already registered')) {
        setError('Ten email jest już zarejestrowany. Spróbuj się zalogować.');
      } else if (authError.message.includes('Invalid login credentials')) {
        setError('Nieprawidłowy email lub hasło.');
      } else {
        setError(authError.message);
      }
    } else {
      // Save email to cookies
      saveUserData({ email });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">
          {mode === 'signin' ? 'Zaloguj się' : 'Zarejestruj się'}
          <p className="text-sm text-gray-600 mt-1">
            {mode === 'signin'
              ? 'Zaloguj się aby zarezerwować wizytę'
              : 'Utwórz konto aby zarezerwować wizytę'}
          </p>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hasło
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
          >
            {mode === 'signin' ? 'Zaloguj' : 'Zarejestruj'}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {mode === 'signin'
                ? 'Nie masz konta? Zarejestruj się'
                : 'Masz już konto? Zaloguj się'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};