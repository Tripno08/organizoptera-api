import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 30000, // E2E tests may take longer
    hookTimeout: 30000,
  },
  plugins: [
    // Use SWC instead of esbuild to support decorator metadata (required for NestJS DI)
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: 'es2022',
      },
    }),
  ],
});
