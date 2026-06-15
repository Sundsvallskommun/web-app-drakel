import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    // Resolve the `@/`, `@controllers/*`, … path aliases. Point at tsconfig.eslint.json
    // because tsconfig.json excludes src/tests, which would make the plugin skip alias
    // resolution inside the test files themselves.
    tsconfigPaths({ projects: ['tsconfig.eslint.json'] }),
    // routing-controllers / class-validator depend on `emitDecoratorMetadata`, which esbuild
    // (Vitest's default transform) does not emit. SWC does, so we transform with it instead.
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2022',
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/data-contracts/**', 'src/**/*.{test,spec}.ts', 'src/types/**', 'src/swagger-typescript-api.ts'],
    },
  },
});
