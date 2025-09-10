import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'src/__tests__/setup.ts', 'src/__tests__/test-utils.tsx'],
    coverage: {
      provider: 'v8',
      exclude: ['src/**/*.d.ts', 'src/index.ts'],
    },
  },
});
