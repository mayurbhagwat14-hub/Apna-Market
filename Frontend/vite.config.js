import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    react(),
    command === 'build' && {
      name: 'force-exit-on-build',
      closeBundle() {
        setTimeout(() => {
          process.exit(0);
        }, 100);
      },
    },
  ].filter(Boolean),
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  esbuild: {
    legalComments: 'none',
    drop: command === 'build' ? ['console', 'debugger'] : [],
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: 'esbuild',
    cssCodeSplit: false,
    emptyOutDir: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1500,
    modulePreload: {
      polyfill: false,
    },
  },
}));
