import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    modulePreload: { polyfill: false },
  },
  esbuild: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
});
