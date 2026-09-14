import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/__tests__/**', 'src/lib/i18n/**'],
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
