import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    react(),
  ],
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
    chunkSizeWarningLimit: 1200,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      output: {
        manualChunks: (() => {
          const VENDOR_REACT = /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/;
          const VENDOR_RECHARTS = /[\\/]node_modules[\\/](recharts|d3-|victory-vendor)/;
          const VENDOR_GOOGLE_MAPS = /[\\/]node_modules[\\/]@react-google-maps/;
          const VENDOR_LEAFLET = /[\\/]node_modules[\\/](leaflet|react-leaflet)/;
          const VENDOR_MOTION = /[\\/]node_modules[\\/](framer-motion|gsap)/;
          const VENDOR_FIREBASE = /[\\/]node_modules[\\/](firebase|@firebase)/;
          const VENDOR_ICONS = /[\\/]node_modules[\\/](react-icons)/;
          const VENDOR_UTILS = /[\\/]node_modules[\\/](axios|date-fns|zod|socket\.io-client|react-hot-toast)/;

          return (id) => {
            if (!id.includes('node_modules')) return;
            if (VENDOR_REACT.test(id)) return 'vendor-react';
            if (VENDOR_RECHARTS.test(id)) return 'vendor-recharts';
            if (VENDOR_GOOGLE_MAPS.test(id)) return 'vendor-maps-google';
            if (VENDOR_LEAFLET.test(id)) return 'vendor-maps-leaflet';
            if (VENDOR_MOTION.test(id)) return 'vendor-motion';
            if (VENDOR_FIREBASE.test(id)) return 'vendor-firebase';
            if (VENDOR_ICONS.test(id)) return 'vendor-icons';
            if (VENDOR_UTILS.test(id)) return 'vendor-utils';
            return 'vendor-libs';
          };
        })(),
      },
    },
  },
}));
