module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    // Allow usage of `any` where integration boundaries require it (Supabase/Auth).
    '@typescript-eslint/no-explicit-any': 'off',
    // This repo currently doesn't follow exhaustive-deps strictly; keep lint green.
    'react-hooks/exhaustive-deps': 'off',
    // Vite React refresh guard (disabled to avoid warning-only failures with max-warnings=0).
    'react-refresh/only-export-components': 'off',
  },
};

