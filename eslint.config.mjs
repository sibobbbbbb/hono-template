import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Menggunakan konfigurasi yang direkomendasikan dari typescript-eslint
  ...tseslint.configs.recommended,

  // Menonaktifkan aturan ESLint yang berkonflik dengan Prettier
  eslintConfigPrettier,

  // Aturan kustom Anda sendiri
  {
    rules: {
      'no-var': 'error',
      'prefer-const': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        }],
    },
  },

  // Konfigurasi untuk mengabaikan file/folder tertentu
  {
    ignores: ['node_modules/', 'dist/'],
  }
);