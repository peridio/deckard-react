import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.stories.ts',
        '**/*.stories.tsx',
      ],
    }),
  ],
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DeckardReact',
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'esm' : format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-icons/hi2'],
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'React',
          'react-icons/hi2': 'ReactIconsHi2',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
});
