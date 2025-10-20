import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use the automatic JSX runtime (modern transform)
      jsxRuntime: 'automatic',
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false, // Set to true if you want source maps in production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['axios', 'date-fns', 'dayjs', 'moment'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true, // Allow external connections
    allowedHosts: [
      'localhost',
      '.ngrok-free.app', // Allow all ngrok free app domains
      '.ngrok.io', // Allow ngrok.io domains
      '.ngrok.app', // Allow ngrok.app domains
    ],
    hmr: {
      clientPort: 443, // Use HTTPS port for HMR over ngrok
    },
    proxy: {
      '/privacy-policy': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
})
