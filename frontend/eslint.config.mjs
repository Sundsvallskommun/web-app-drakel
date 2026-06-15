import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import eslintConfigPrettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

// NOTE on the typescript-eslint plugin: eslint-config-next resolves `typescript-eslint`
// from the hoisted top-level install (no nested copy), so spreading
// tseslint.configs.strictTypeChecked here reuses the SAME plugin instance Next registers —
// no "Cannot redefine plugin @typescript-eslint" collision. Keep frontend's
// `typescript-eslint` dependency on the same major as eslint-config-next so they dedupe.
export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'out/**',
      'coverage/**',
      'next-env.d.ts',
      'src/**/data-contracts/**',
      '*.config.js',
      '*.config.mjs',
      'middleware-envs-generator.mjs',
      'next-i18next.config.js',
      'src/swagger-typescript-api.ts',
    ],
  },
  // Next.js (React + react-hooks + @next/next + core-web-vitals + @typescript-eslint base).
  ...nextCoreWebVitals,
  // Maximal, type-aware strictness — stronger than the reference repo (which allows `any`).
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // Mirrors the pre-commit guard: console.log is forbidden, warn/error are allowed.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Allow primitives in template literals; objects/`unknown` are still flagged.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }],
      // Off: fights legitimate defensive checks against external/`any` data and
      // noUncheckedIndexedAccess. The rest of the type-aware rules stay on.
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // Off: these React-pattern rules (not type-safety) fire on the intentional
      // "fetch in effect → setState" data-loading pattern used by the hooks here.
      // Enforcing them would force effect/architecture rewrites; revisit if hooks change.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  // Must be last: turns off stylistic rules that conflict with Prettier.
  eslintConfigPrettier,
);
