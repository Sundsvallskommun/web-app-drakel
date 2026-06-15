import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Generated API clients are never hand-edited; build output and coverage are not source.
    // `*.d.ts` are ambient type augmentations; `swagger-typescript-api.ts` is a codegen script.
    ignores: ['dist/**', 'coverage/**', 'src/data-contracts/**', '**/*.d.ts', 'src/swagger-typescript-api.ts'],
  },
  eslint.configs.recommended,
  // Maximal, type-aware strictness — stricter than the reference repo (which allows `any`).
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    // Register .ts as a linted extension (flat config defaults to .js only) and scope
    // the type-aware rules + parser project to TypeScript sources.
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        // Dedicated tsconfig that also includes tests/config so type-aware rules have types.
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      // No `any` anywhere in hand-written code.
      '@typescript-eslint/no-explicit-any': 'error',
      // Delegate unused detection to unused-imports (autofixable + `_` escape hatch).
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
      // Allow primitives in template literals (logging numbers/booleans is fine); objects and
      // `unknown` are still flagged so we don't accidentally interpolate "[object Object]".
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }],
      // Off: this rule fights legitimate defensive checks against externally-sourced/`any` data
      // and interacts badly with noUncheckedIndexedAccess. The other type-aware rules stay on.
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  // Must be last: turns off stylistic rules that conflict with Prettier.
  eslintConfigPrettier,
);
