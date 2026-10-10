import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    react(),
    command === 'build' && {
      name: 'exit-on-build-finish',
      closeBundle() {
        setTimeout(() => {
          process.exit(0);
        }, 150);
      },
    },
  ].filter(Boolean),
  esbuild: {
    legalComments: 'none',
    drop: command === 'build' ? ['console', 'debugger'] : [],
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 800,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          const norm = id.split('\\').join('/');

          // 1. Core React runtime & routing
          if (
            norm.includes('/react/') ||
            norm.includes('/react-dom/') ||
            norm.includes('/scheduler/') ||
            norm.includes('/react-router/') ||
            norm.includes('/react-router-dom/')
          ) {
            return 'vendor-react';
          }

          // 2. Charts & heavy data visualization (Recharts + d3 + victory)
          if (
            norm.includes('recharts') ||
            norm.includes('d3-') ||
            norm.includes('victory-vendor')
          ) {
            return 'vendor-recharts';
          }

          // 3. Google Maps API (standalone chunk)
          if (norm.includes('@react-google-maps')) {
            return 'vendor-maps-google';
          }

          // 4. Leaflet maps (standalone chunk, separate from Google Maps)
          if (norm.includes('leaflet') || norm.includes('react-leaflet')) {
            return 'vendor-maps-leaflet';
          }

          // 5. Animations
          if (norm.includes('framer-motion')) {
            return 'vendor-motion';
          }
          if (norm.includes('gsap')) {
            return 'vendor-gsap';
          }

          // 6. Firebase & Realtime DB
          if (norm.includes('firebase') || norm.includes('@firebase')) {
            return 'vendor-firebase';
          }

          // 7. Icons
          if (norm.includes('react-icons')) {
            return 'vendor-icons';
          }

          // 8. Common HTTP, validation & realtime utilities
          if (
            norm.includes('axios') ||
            norm.includes('date-fns') ||
            norm.includes('zod') ||
            norm.includes('socket.io-client') ||
            norm.includes('react-hot-toast')
          ) {
            return 'vendor-utils';
          }
        },
      },
    },
  },
}));
