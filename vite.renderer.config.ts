import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config
export default defineConfig({
  root: resolve(__dirname, 'src'),
  base: './',
  build: {
    outDir: resolve(__dirname, '.vite/renderer/main_window'),
    rollupOptions: {
      input: {
        main_window: resolve(__dirname, 'src/index.html'),
        modal_window: resolve(__dirname, 'src/modal.html'),
      },
    },
  },
});
